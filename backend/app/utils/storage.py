"""Armazenamento de imagens/vídeos: S3/MinIO ou disco local (desenvolvimento)."""

import logging
import secrets
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_s3_client():
    if not all([settings.S3_BUCKET, settings.S3_ACCESS_KEY, settings.S3_SECRET_KEY]):
        return None
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION,
    )


_IMAGE_MAGIC: dict[bytes, str] = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "image/webp",
}
_ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

_VIDEO_MAGIC: dict[bytes, str] = {
    b"\x00\x00\x00\x18ftyp": "video/mp4",
    b"\x00\x00\x00\x1cftyp": "video/mp4",
    b"\x00\x00\x00\x20ftyp": "video/mp4",
    b"RIFF": "video/avi",
    b"\x1aE\xdf\xa3": "video/webm",
}
_ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}


def _validate_image_magic(data: bytes) -> str:
    for magic, mime in _IMAGE_MAGIC.items():
        if data[: len(magic)] == magic:
            if mime == "image/webp" and data[8:12] != b"WEBP":
                continue
            return mime
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Ficheiro não reconhecido como imagem válida (JPEG, PNG ou WebP).",
    )


async def _validate_image(file: UploadFile) -> bytes:
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in _ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Extensão de ficheiro não permitida. Use JPEG, PNG ou WebP.",
            )

    data = await file.read()
    await file.seek(0)

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Imagem maior que {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    _validate_image_magic(data)
    return data


async def _validate_video(file: UploadFile) -> bytes:
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in _ALLOWED_VIDEO_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Extensão de vídeo não permitida. Use MP4, MOV ou WebM.",
            )

    data = await file.read()
    await file.seek(0)

    max_bytes = settings.MAX_VIDEO_SIZE_MB * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Vídeo maior que {settings.MAX_VIDEO_SIZE_MB}MB.",
        )

    # Validação leve — aceita se extensão é válida; magic bytes de vídeo variam muito por container
    return data


async def upload_media(file: UploadFile, entity_type: str, is_video: bool = False) -> str:
    """Faz upload de imagem ou vídeo e devolve URL pública.

    entity_type: "properties", "profile" — organiza chaves S3 / pastas locais.
    """
    data = await (_validate_video(file) if is_video else _validate_image(file))

    allowed_ext = _ALLOWED_VIDEO_EXTENSIONS if is_video else _ALLOWED_IMAGE_EXTENSIONS
    default_ext = ".mp4" if is_video else ".jpg"
    ext = Path(file.filename).suffix.lower() if file.filename else default_ext
    if ext not in allowed_ext:
        ext = default_ext

    unique_name = f"{secrets.token_hex(16)}{ext}"
    subfolder = f"{entity_type}/{'videos' if is_video else 'imagens'}"
    key = f"{subfolder}/{unique_name}"

    s3_client = _get_s3_client()

    if s3_client:
        try:
            s3_client.put_object(
                Bucket=settings.S3_BUCKET,
                Key=key,
                Body=data,
                ContentType=file.content_type,
                ACL="public-read",
            )
            if settings.S3_PUBLIC_URL_BASE:
                return f"{settings.S3_PUBLIC_URL_BASE}/{key}"
            elif settings.S3_ENDPOINT_URL:
                return f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET}/{key}"
            else:
                return f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/{key}"
        except ClientError as exc:
            logger.error("Erro S3 ao fazer upload: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao armazenar ficheiro.",
            ) from exc
    else:
        upload_dir = Path(settings.LOCAL_UPLOAD_DIR) / subfolder
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / unique_name
        file_path.write_bytes(data)
        return f"{settings.LOCAL_UPLOAD_PUBLIC_BASE}/{subfolder}/{unique_name}"


async def delete_media(url: str) -> bool:
    if not url:
        return False
    s3_client = _get_s3_client()
    if s3_client:
        try:
            key = url.split(f"{settings.S3_BUCKET}/")[-1]
            s3_client.delete_object(Bucket=settings.S3_BUCKET, Key=key)
            return True
        except Exception as exc:
            logger.error("Erro ao apagar ficheiro S3: %s", exc)
            return False
    else:
        try:
            file_path = Path(settings.LOCAL_UPLOAD_DIR) / url.split(f"{settings.LOCAL_UPLOAD_PUBLIC_BASE}/")[-1]
            file_path.unlink(missing_ok=True)
            return True
        except Exception as exc:
            logger.error("Erro ao apagar ficheiro local: %s", exc)
            return False
