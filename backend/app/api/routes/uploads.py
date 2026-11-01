"""Rotas de upload de imagens e vídeos."""

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.deps import get_current_user
from app.models.user import User
from app.utils.storage import upload_media

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Faz upload de uma imagem e devolve a URL pública."""
    url = await upload_media(file, entity_type="properties", is_video=False)
    return {"url": url}


@router.post("/video", status_code=status.HTTP_201_CREATED)
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Faz upload de um vídeo e devolve a URL pública."""
    url = await upload_media(file, entity_type="properties", is_video=True)
    return {"url": url}


@router.post("/profile-photo", status_code=status.HTTP_201_CREATED)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Faz upload da foto de perfil."""
    url = await upload_media(file, entity_type="profile", is_video=False)
    return {"url": url}
