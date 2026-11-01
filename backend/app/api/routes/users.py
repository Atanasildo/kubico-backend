from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.core.config import settings
from app.crud.user import get_user_by_id, update_user
from app.models.user import User, UserRole
from app.schemas.user import AdminPromoteRequest, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["Utilizadores"])


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserRead)
def update_me(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_user(db, current_user, user_in)


@router.post("/me/promote-admin", response_model=UserRead)
def promote_to_admin(
    payload: AdminPromoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Auto-promoção a admin via chave secreta — apenas para setup inicial."""
    if payload.chave != settings.ADMIN_SETUP_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chave inválida.")
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Já és admin.")
    current_user.role = UserRole.ADMIN
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserRead)
def read_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    import uuid
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="ID inválido.")
    user = get_user_by_id(db, uid)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilizador não encontrado.")
    return user
