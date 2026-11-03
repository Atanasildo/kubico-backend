"""Armazenamento de imagens/vídeos: Supabase Storage REST API ou disco local."""

import io
import logging
import secrets
from pathlib import Path

import httpx
from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import settings

logger = logging.getLogger(__name__)

# Magic bytes para vídeos
_VIDEO_MAGIC: list[tuple[bytes, str]] = [
    (b"\x1aE\xdf\xa3", "video/webm"),           # WebM EBML header
]

_FTYP_VIDEO_BRANDS = {
    b"mp41", b"mp42", b"isom", b"iso2", b"avc1",  # MP4
    b"qt  ",                                         # MOV (QuickTime)
    b"M4V ", b"M4A ",                               # M4V/M4A
    b"mmp4", b"f4v ",                               # variantes
}

# Dimensão máxima por eixo para prevenir image bomb (descompressão explosiva)
_MAX_IMAGE_DIMENSION_PX = 20_000

# Magic bytes: prefix -> mime type
# HEIC/HEIF/AVIF are ISO Base Media File Format (ftyp box at offset 4)
_IMAGE_MAGIC: dict[bytes, str] = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "image/webp",
    b"GIF87a": "image/gif",
    b"GIF89a": "image/gif",
    b"BM": "image/bmp",
}

_FTYP_BRANDS_HEIC = {b"heic", b"heix", b"hevc", b"hevx", b"heim", b"heis", b"hevm", b"hevs", b"mif1"}
_FTYP_BRANDS_AVIF = {b"avif", b"avis"}

_ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg",   # JPEG
    ".png",            # PNG
    ".webp",           # WebP
    ".gif",            # GIF
    ".bmp",            # BMP
    ".heic", ".heif",  # HEIC / HEIF (iPhone)
    ".avif",           # AVIF
    ".tiff", ".tif",   # TIFF
}

_ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}

# Extension -> mime fallback (for formats without simple prefix magic)
_EXT_MIME: dict[str, str] = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".avif": "image/avif",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
}


def _check_ftyp_brand(data: bytes, brands: set[bytes]) -> bool:
    """ISO BMFF: box size (4 bytes) + 'ftyp' (4 bytes) + major brand (4 bytes)."""
    if len(data) < 12:
        return False
    if data[4:8] != b"ftyp":
        return False
    major = data[8:12].lower().rstrip(b"\x00")
    return major in brands


def _validate_image_magic(data: bytes, ext: str) -> str:
    # Standard magic prefix check
    for magic, mime in _IMAGE_MAGIC.items():
        if data[: len(magic)] == magic:
            if mime == "image/webp" and data[8:12] != b"WEBP":
                continue
            return mime

    # TIFF: little-endian II or big-endian MM
    if len(data) >= 4 and data[:2] in (b"II", b"MM") and data[2:4] in (b"*\x00", b"\x00*"):
        return "image/tiff"

    # ISO BMFF containers: HEIC/HEIF and AVIF
    if _check_ftyp_brand(data, _FTYP_BRANDS_HEIC):
        return "image/heic"
    if _check_ftyp_brand(data, _FTYP_BRANDS_AVIF):
        return "image/avif"

    # Fallback: trust the extension if it's in our allowed set
    mime = _EXT_MIME.get(ext)
    if mime:
        return mime

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Ficheiro não reconhecido como imagem válida.",
    )


async def _read_and_validate_image(file: UploadFile) -> tuple[bytes, str]:
    ext = ""
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in _ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Extensão não permitida: {ext}. Use JPEG, PNG, WebP, GIF, BMP, HEIC/HEIF, AVIF ou TIFF.",
            )
    data = await file.read()
    await file.seek(0)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Imagem maior que {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )
    mime = _validate_image_magic(data, ext)
    # Prevenir image bomb — verificar dimensões antes de processar
    _check_image_dimensions(data)
    return data, mime


def _validate_video_magic(data: bytes, ext: str) -> str:
    """Valida magic bytes de vídeo. Lança HTTPException se inválido."""
    # Standard magic prefix
    for magic, mime in _VIDEO_MAGIC:
        if data[:len(magic)] == magic:
            return mime
    # ISO BMFF ftyp box (MP4, MOV, M4V…) — offset 4: "ftyp", offset 8: brand
    if len(data) >= 12 and data[4:8] == b"ftyp":
        brand = data[8:12].rstrip(b"\x00")
        if brand in _FTYP_VIDEO_BRANDS:
            return "video/mp4"
    # Fallback por extensão apenas se a extensão for explicitamente permitida
    if ext in (".mp4", ".mov"):
        return "video/mp4"
    if ext == ".webm":
        return "video/webm"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Ficheiro não reconhecido como vídeo válido. Use MP4, MOV ou WebM.",
    )


def _check_image_dimensions(data: bytes) -> None:
    """Previne image bomb — rejeita imagens com dimensões absurdas."""
    try:
        img = Image.open(io.BytesIO(data))
        w, h = img.size
        if w > _MAX_IMAGE_DIMENSION_PX or h > _MAX_IMAGE_DIMENSION_PX:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Imagem demasiado grande ({w}×{h}px). Máximo: {_MAX_IMAGE_DIMENSION_PX}px por eixo.",
            )
    except HTTPException:
        raise
    except UnidentifiedImageError:
        pass  # formato não reconhecido pelo Pillow — magic check já tratou
    except Exception as exc:
        logger.debug("Pillow não conseguiu verificar dimensões: %s", exc)


async def _read_and_validate_video(file: UploadFile) -> tuple[bytes, str]:
    ext = ""
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
            detail=f"Vídeo maior que {settings.MAX_VIDEO_SIZE_MB} MB.",
        )
    # Magic byte validation — impede upload de ficheiros mascarados como vídeo
    mime = _validate_video_magic(data, ext)
    return data, mime


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

    logger.warning("SUPABASE não configurado - a guardar localmente (ephemeral no Render).")
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
