import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.crud.user import (
    authenticate_user,
    create_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_phone,
)
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import ChangePasswordRequest, UserCreate, UserLogin, UserRead

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Cria conta e devolve tokens prontos a usar — sem precisar de fazer login separado."""
    # Verificar email duplicado
    if get_user_by_email(db, user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está registado.",
        )
    # Verificar telefone duplicado (se fornecido)
    if user_in.telefone and get_user_by_phone(db, user_in.telefone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este número de telefone já está associado a outra conta.",
        )
    try:
        user = create_user(db, user_in)
    except IntegrityError as e:
        db.rollback()
        # Fallback: constraint de unicidade na DB (email ou telefone em race condition)
        err_str = str(e.orig).lower() if e.orig else ""
        if "telefone" in err_str or "phone" in err_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este número de telefone já está associado a outra conta.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está registado.",
        )

    return Token(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.senha)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos.",
        )
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta desactivada. Contacta o suporte.",
        )
    return Token(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=Token)
def refresh_token(token: str, db: Session = Depends(get_db)):
    """Troca um refresh token válido por um novo par de tokens."""
    payload = decode_token(token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado.",
        )
    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )

    user = get_user_by_id(db, user_id)
    if not user or not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilizador não encontrado.",
        )

    return Token(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.senha_atual, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta.",
        )
    current_user.hashed_password = hash_password(payload.senha_nova)
    db.add(current_user)
    db.commit()
    return {"detail": "Senha alterada com sucesso."}
