"""Armazenamento de imagens/vídeos: Supabase Storage (S3-compatible) ou disco local."""

import logging
import secrets
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Supabase Storage S3-compatible endpoint ───────────────────────────────────
# endpoint: https://<ref>.supabase.co/storage/v1/s3
# region:   any string (Supabase ignores it, but boto3 requires one)
# access_key: project ref  (the part before .supabase.co)
# secret_key: service_role JWT

def _get_s3_client():
    """Returns a boto3 S3 client configured for Supabase Storage.

    Falls back to standard AWS S3 / MinIO when S3_ENDPOINT_URL is not a
    Supabase URL.  Returns None when no S3 credentials are configured at all.
    """
    # Supabase path — detect via SUPABASE_URL env
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY and settings.SUPABASE_BUCKET:
        ref = settings.SUPABASE_URL.rstrip("/").replace("https://", "").split(".")[0]
        endpoint = f"https://{ref}.supabase.co/storage/v1/s3"
        return boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=ref,
            aws_secret_access_key=settings.SUPABASE_SERVICE_KEY,
            region_name="us-east-1",  # required by boto3, ignored by Supabase
        )

    # Generic S3 / MinIO fallback
    if all([settings.S3_BUCKET, settings.S3_ACCESS_KEY, settings.S3_SECRET_KEY]):
        return boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL or None,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
        )

    return None


def _public_url(key: str) -> str:
    """Build the public URL for an uploaded object."""
    if settings.SUPABASE_URL and settings.SUPABASE_BUCKET:
        ref = settings.SUPABASE_URL.rstrip("/").replace("https://", "").split(".")[0]
        return f"https://{ref}.supabase.co/storage/v1/object/public/{settings.SUPABASE_BUCKET}/{key}"
    if settings.S3_PUBLIC_URL_BASE:
        return f"{settings.S3_PUBLIC_URL_BASE}/{key}"
    if settings.S3_ENDPOINT_URL:
        return f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET}/{key}"
    return f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/{key}"


# ── Validation ────────────────────────────────────────────────────────────────
_IMAGE_MAGIC: dict[bytes, str] = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "image/webp",
}
_ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
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
                detail="Extensão não permitida. Use JPEG, PNG ou WebP.",
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
    return data


# ── Main upload function ──────────────────────────────────────────────────────
async def upload_media(file: UploadFile, entity_type: str, is_video: bool = False) -> str:
    """Upload image or video, return public URL."""
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
    bucket = settings.SUPABASE_BUCKET or settings.S3_BUCKET

    if s3_client and bucket:
        try:
            s3_client.put_object(
                Bucket=bucket,
                Key=key,
                Body=data,
                ContentType=file.content_type or ("video/mp4" if is_video else "image/jpeg"),
            )
            return _public_url(key)
        except ClientError as exc:
            logger.error("Erro S3/Supabase ao fazer upload: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao armazenar ficheiro.",
            ) from exc
    else:
        # Local fallback (dev only — files lost on Render restart)
        upload_dir = Path(settings.LOCAL_UPLOAD_DIR) / subfolder
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / unique_name
        file_path.write_bytes(data)
        return f"{settings.LOCAL_UPLOAD_PUBLIC_BASE}/{subfolder}/{unique_name}"


async def delete_media(url: str) -> bool:
    if not url:
        return False
    s3_client = _get_s3_client()
    bucket = settings.SUPABASE_BUCKET or settings.S3_BUCKET
    if s3_client and bucket:
        try:
            # Extract key from URL
            if settings.SUPABASE_URL and settings.SUPABASE_BUCKET:
                marker = f"/object/public/{settings.SUPABASE_BUCKET}/"
            else:
                marker = f"{bucket}/"
            key = url.split(marker)[-1]
            s3_client.delete_object(Bucket=bucket, Key=key)
            return True
        except Exception as exc:
            logger.error("Erro ao apagar ficheiro: %s", exc)
            return False
    else:
        try:
            file_path = Path(settings.LOCAL_UPLOAD_DIR) / url.split(
                f"{settings.LOCAL_UPLOAD_PUBLIC_BASE}/"
            )[-1]
            file_path.unlink(missing_ok=True)
            return True
        except Exception as exc:
            logger.error("Erro ao apagar ficheiro local: %s", exc)
            return False
