"""Rotas de verificação OTP — email e telefone."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.crud.verification import generate_and_store_code, verify_code
from app.models.user import User
from app.models.verification import VerificationChannel

router = APIRouter(prefix="/verification", tags=["Verificação OTP"])


class RequestCodePayload(BaseModel):
    canal: VerificationChannel


class VerifyCodePayload(BaseModel):
    canal: VerificationChannel
    codigo: str


@router.post("/request-code", status_code=status.HTTP_200_OK)
def request_code(
    payload: RequestCodePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Gera e guarda um OTP. Em produção, enviar por email/SMS."""
    if payload.canal == VerificationChannel.EMAIL:
        destino = current_user.email
    else:
        if not current_user.telefone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Adicione um número de telefone antes de verificar.",
            )
        destino = current_user.telefone

    codigo = generate_and_store_code(db, current_user.id, payload.canal, destino)

    # TODO em produção: enviar email via SMTP ou SMS via gateway
    # Por agora, devolve o código directamente (apenas em dev)
    return {
        "detail": f"Código enviado para {destino}.",
        "codigo_dev": codigo,  # remover em produção
    }


@router.post("/verify-code", status_code=status.HTTP_200_OK)
def verify(
    payload: VerifyCodePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_code(db, current_user.id, payload.canal, payload.codigo)

    if payload.canal == VerificationChannel.EMAIL:
        current_user.email_verificado = True
    else:
        current_user.telefone_verificado = True
    db.add(current_user)
    db.commit()
    return {"detail": "Verificação concluída com sucesso."}
