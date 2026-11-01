import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.crud.interaction import list_favorites, toggle_favorite
from app.crud.property import get_property
from app.models.user import User
from app.schemas.interaction import FavoriteRead

router = APIRouter(prefix="/favorites", tags=["Favoritos"])


@router.post("/{property_id}/toggle", status_code=status.HTTP_200_OK)
def toggle(
    property_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_prop = get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")
    favorited = toggle_favorite(db, current_user.id, property_id)
    return {"favoritado": favorited}


@router.get("/", response_model=list[FavoriteRead])
def my_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_favorites(db, current_user.id)
