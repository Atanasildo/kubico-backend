import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.crud.user import (
    authenticate_user,
    create_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_phone,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import ChangePasswordRequest, UserCreate, UserLogin, UserRead

router = APIRouter(prefix="/auth", tags=["Autenticação"])
limiter = Limiter(key_func=get_remote_address)


def _store_refresh_token(db: Session, user_id: uuid.UUID, raw_token: str) -> None:
    """Persiste hash do refresh token na DB."""
    payload = decode_token(raw_token)
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc) if payload else (
        datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db_token = RefreshToken(
        user_id=user_id,
        token_hash=hash_token(raw_token),
        expires_at=expires_at,
    )
    db.add(db_token)
    db.commit()


def _revoke_refresh_token(db: Session, raw_token: str) -> bool:
    """Marca token como usado. Devolve False se não encontrado ou já usado."""
    h = hash_token(raw_token)
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == h,
        RefreshToken.usado == False,  # noqa: E712
    ).first()
    if not db_token:
        return False
    db_token.usado = True
    db.commit()
    return True


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    """Cria conta e devolve tokens prontos a usar."""
    if get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Este email já está registado.")
    if user_in.telefone and get_user_by_phone(db, user_in.telefone):
        raise HTTPException(status_code=400, detail="Este número de telefone já está associado a outra conta.")
    try:
        user = create_user(db, user_in)
    except IntegrityError as e:
        db.rollback()
        err_str = str(e.orig).lower() if e.orig else ""
        if "telefone" in err_str or "phone" in err_str:
            raise HTTPException(status_code=400, detail="Este número de telefone já está associado a outra conta.")
        raise HTTPException(status_code=400, detail="Este email já está registado.")

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    _store_refresh_token(db, user.id, refresh)
    return Token(access_token=access, refresh_token=refresh)


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.senha)
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos.")
    if not user.ativo:
        raise HTTPException(status_code=403, detail="Conta desactivada. Contacta o suporte.")

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    _store_refresh_token(db, user.id, refresh)
    return Token(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=Token)
def refresh_token(token: str, db: Session = Depends(get_db)):
    """Troca refresh token por novo par. O token usado é invalidado (rotação)."""
    payload = decode_token(token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token inválido ou expirado.")

    # Verificar se token está na DB e não foi usado
    h = hash_token(token)
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == h,
        RefreshToken.usado == False,  # noqa: E712
    ).first()
    if not db_token:
        raise HTTPException(status_code=401, detail="Refresh token inválido, expirado ou já utilizado.")

    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido.")

    user = get_user_by_id(db, user_id)
    if not user or not user.ativo:
        raise HTTPException(status_code=401, detail="Utilizador não encontrado.")

    # Invalidar o token actual (rotação)
    db_token.usado = True
    db.commit()

    # Emitir novo par
    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    _store_refresh_token(db, user.id, refresh)
    return Token(access_token=access, refresh_token=refresh)


@router.post("/logout", status_code=200)
def logout(token: str, db: Session = Depends(get_db)):
    """Invalida o refresh token — impede renovação de sessão."""
    revoked = _revoke_refresh_token(db, token)
    # Resposta idêntica independentemente de o token existir (não vazar estado)
    return {"detail": "Sessão terminada."}


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password", status_code=200)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.senha_atual, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")
    current_user.hashed_password = hash_password(payload.senha_nova)
    db.add(current_user)
    # Invalidar todos os refresh tokens activos do utilizador ao mudar senha
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.usado == False,  # noqa: E712
    ).update({"usado": True})
    db.commit()
    return {"detail": "Senha alterada com sucesso. Todas as sessões foram encerradas."}
