import hashlib
import secrets
import uuid

from pydantic import BaseModel, Field
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
from app.models.password_reset import PasswordResetToken
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.core.email import send_email, html_reset_senha
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

    db_token.usado = True
    db.commit()

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    _store_refresh_token(db, user.id, refresh)
    return Token(access_token=access, refresh_token=refresh)


@router.post("/logout", status_code=200)
def logout(token: str, db: Session = Depends(get_db)):
    """Invalida o refresh token — impede renovação de sessão."""
    _revoke_refresh_token(db, token)
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
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.usado == False,  # noqa: E712
    ).update({"usado": True})
    db.commit()
    return {"detail": "Senha alterada com sucesso. Todas as sessões foram encerradas."}


# ── Recuperação de senha por EMAIL ───────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    nova_senha: str = Field(min_length=8)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("3/hour")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Envia email de recuperação. Sempre devolve 202 para não revelar se o email existe."""
    user = get_user_by_email(db, body.email)
    _msg = {"message": "Se o email existir, receberá instruções em breve."}
    if not user or not user.ativo:
        return _msg

    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.usado == False,  # noqa: E712
    ).delete(synchronize_session=False)

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expira_em = datetime.now(timezone.utc) + timedelta(minutes=30)

    db_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expira_em=expira_em,
    )
    db.add(db_token)
    db.commit()

    frontend_url = settings.FRONTEND_URL.rstrip("/")
    link = f"{frontend_url}/auth/reset-password?token={raw_token}"
    enviado = send_email(user.email, "Recuperação de senha — Kubico", html_reset_senha(link))
    if not enviado:
        # Não revelar ao cliente, mas registar internamente
        print(f"[WARN forgot-password] SMTP não configurado — link não enviado para {user.email}")

    return _msg


@router.post("/reset-password", status_code=status.HTTP_200_OK)
@limiter.limit("5/hour")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Valida o token e redefine a senha."""
    token_hash = hashlib.sha256(body.token.encode()).hexdigest()
    now = datetime.now(timezone.utc)

    db_token = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.usado == False,  # noqa: E712
            PasswordResetToken.expira_em > now,
        )
        .first()
    )
    if not db_token:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado.")

    user = get_user_by_id(db, db_token.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Token inválido.")

    user.hashed_password = hash_password(body.nova_senha)
    db_token.usado = True
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete(
        synchronize_session=False
    )
    db.commit()

    return {"message": "Senha alterada com sucesso."}


# ── Recuperação de senha por TELEFONE (OTP) ──────────────────────────────────

class ForgotPasswordPhoneRequest(BaseModel):
    telefone: str


class ResetPasswordPhoneRequest(BaseModel):
    telefone: str
    codigo: str
    nova_senha: str = Field(min_length=8)


@router.post("/forgot-password-phone", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("3/hour")
async def forgot_password_phone(
    request: Request,
    body: ForgotPasswordPhoneRequest,
    db: Session = Depends(get_db),
):
    """Envia OTP via SMS para recuperar senha. Sempre devolve 202."""
    from app.crud.verification import generate_and_store_code
    from app.models.verification import VerificationChannel
    from app.utils.sms import send_sms

    _msg = {"message": "Se o número existir, receberá um código em breve."}
    user = get_user_by_phone(db, body.telefone)
    if not user or not user.ativo:
        return _msg

    try:
        codigo = generate_and_store_code(
            db, user.id, VerificationChannel.TELEFONE, body.telefone
        )
    except HTTPException:
        # rate-limit do OTP — não revelar
        return _msg

    mensagem = f"Kubico: o teu código de recuperação de senha é {codigo}. Válido por 10 minutos."
    send_sms(body.telefone, mensagem)
    return _msg


@router.post("/reset-password-phone", status_code=status.HTTP_200_OK)
@limiter.limit("5/hour")
async def reset_password_phone(
    request: Request,
    body: ResetPasswordPhoneRequest,
    db: Session = Depends(get_db),
):
    """Valida OTP de telefone e redefine a senha."""
    from app.crud.verification import verify_code
    from app.models.verification import VerificationChannel

    user = get_user_by_phone(db, body.telefone)
    if not user or not user.ativo:
        raise HTTPException(status_code=400, detail="Código inválido ou expirado.")

    # verify_code lança HTTPException se falhar
    verify_code(db, user.id, VerificationChannel.TELEFONE, body.codigo)

    user.hashed_password = hash_password(body.nova_senha)
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete(
        synchronize_session=False
    )
    db.commit()
    return {"message": "Senha alterada com sucesso."}
