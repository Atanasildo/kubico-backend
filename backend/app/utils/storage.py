"""Armazenamento de imagens/vídeos: Supabase Storage REST API ou disco local."""

import logging
import secrets
from pathlib import Path

import httpx
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

logger = logging.getLogger(__name__)

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
        detail="Ficheiro nao reconhecido como imagem valida (JPEG, PNG ou WebP).",
    )


async def _read_and_validate_image(file: UploadFile) -> tuple[bytes, str]:
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in _ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Extensao nao permitida. Use JPEG, PNG ou WebP.",
            )
    data = await file.read()
    await file.seek(0)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Imagem maior que {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )
    mime = _validate_image_magic(data)
    return data, mime


async def _read_and_validate_video(file: UploadFile) -> tuple[bytes, str]:
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in _ALLOWED_VIDEO_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Extensao de video nao permitida. Use MP4, MOV ou WebM.",
            )
    data = await file.read()
    await file.seek(0)
    max_bytes = settings.MAX_VIDEO_SIZE_MB * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Video maior que {settings.MAX_VIDEO_SIZE_MB} MB.",
        )
    ct = file.content_type or "video/mp4"
    return data, ct


def _supabase_configured() -> bool:
    return bool(
        settings.SUPABASE_URL
        and settings.SUPABASE_SERVICE_KEY
        and settings.SUPABASE_BUCKET
    )


def _public_url(key: str) -> str:
    base = settings.SUPABASE_URL.rstrip("/")
    bucket = settings.SUPABASE_BUCKET
    return f"{base}/storage/v1/object/public/{bucket}/{key}"


async def _supabase_upload(key: str, data: bytes, content_type: str) -> str:
    base = settings.SUPABASE_URL.rstrip("/")
    bucket = settings.SUPABASE_BUCKET
    url = f"{base}/storage/v1/object/{bucket}/{key}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            url,
            content=data,
            headers={
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
                "Content-Type": content_type,
                "x-upsert": "true",
            },
        )

    if resp.status_code not in (200, 201):
        logger.error("Supabase upload falhou: %s - %s", resp.status_code, resp.text[:300])
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha ao armazenar ficheiro ({resp.status_code}).",
        )

    return _public_url(key)


def _local_upload(data: bytes, subfolder: str, filename: str) -> str:
    upload_dir = Path(settings.LOCAL_UPLOAD_DIR) / subfolder
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(data)
    return f"{settings.LOCAL_UPLOAD_PUBLIC_BASE}/{subfolder}/{filename}"


async def upload_media(file: UploadFile, entity_type: str, is_video: bool = False) -> str:
    if is_video:
        data, content_type = await _read_and_validate_video(file)
        allowed_ext = _ALLOWED_VIDEO_EXTENSIONS
        default_ext = ".mp4"
    else:
        data, content_type = await _read_and_validate_image(file)
        allowed_ext = _ALLOWED_IMAGE_EXTENSIONS
        default_ext = ".jpg"

    ext = Path(file.filename).suffix.lower() if file.filename else default_ext
    if ext not in allowed_ext:
        ext = default_ext

    unique_name = f"{secrets.token_hex(16)}{ext}"
    subfolder = f"{entity_type}/{'videos' if is_video else 'imagens'}"
    key = f"{subfolder}/{unique_name}"

    if _supabase_configured():
        return await _supabase_upload(key, data, content_type)

    logger.warning("SUPABASE nao configurado - a guardar localmente (ephemeral no Render).")
    return _local_upload(data, subfolder, unique_name)


async def delete_media(url: str) -> bool:
    if not url:
        return False

    if _supabase_configured() and settings.SUPABASE_URL in url:
        base = settings.SUPABASE_URL.rstrip("/")
        bucket = settings.SUPABASE_BUCKET
        marker = f"/storage/v1/object/public/{bucket}/"
        if marker not in url:
            return False
        key = url.split(marker)[-1]
        delete_url = f"{base}/storage/v1/object/{bucket}/{key}"
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.delete(
                    delete_url,
                    headers={"Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}"},
                )
            return resp.status_code in (200, 204)
        except Exception as exc:
            logger.error("Erro ao apagar no Supabase: %s", exc)
            return False

    try:
        rel = url.split(f"{settings.LOCAL_UPLOAD_PUBLIC_BASE}/")[-1]
        (Path(settings.LOCAL_UPLOAD_DIR) / rel).unlink(missing_ok=True)
        return True
    except Exception as exc:
        logger.error("Erro ao apagar ficheiro local: %s", exc)
        return False
