"""Rotas de pagamentos — destaques pagos e plano agente (ProxyPay / Multicaixa Express)."""

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.crud.property import apply_destaque, get_property
from app.models.payment import Payment, PaymentStatus, PaymentTipo
from app.models.user import User, UserRole
from app.schemas.payment import DestaqueRequest, PaymentRead

router = APIRouter(prefix="/payments", tags=["Pagamentos"])

# Preços dos destaques em AOA
_DESTAQUE_PRECOS: dict[int, Decimal] = {
    7: Decimal(str(settings.DESTAQUE_PRECO_7_DIAS)),
    15: Decimal(str(settings.DESTAQUE_PRECO_15_DIAS)),
    30: Decimal(str(settings.DESTAQUE_PRECO_30_DIAS)),
}


def _gerar_referencia_multicaixa() -> tuple[str, str, datetime]:
    """Simula geração de referência Multicaixa — substituir por chamada real ao ProxyPay."""
    import random, string
    entidade = "11333"
    referencia = "".join(random.choices(string.digits, k=9))
    validade = datetime.now(timezone.utc) + timedelta(days=3)
    return entidade, referencia, validade


@router.post("/destaque", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def request_destaque(
    req: DestaqueRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cria uma referência de pagamento Multicaixa para destacar o anúncio."""
    if req.dias not in _DESTAQUE_PRECOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Período inválido. Opções: {sorted(_DESTAQUE_PRECOS.keys())} dias.",
        )
    db_prop = get_property(db, req.imovel_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")
    if db_prop.autor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão.")

    entidade, referencia, validade = _gerar_referencia_multicaixa()
    payment = Payment(
        utilizador_id=current_user.id,
        imovel_id=req.imovel_id,
        tipo=PaymentTipo.DESTAQUE,
        valor=_DESTAQUE_PRECOS[req.dias],
        status=PaymentStatus.PENDENTE,
        entidade=entidade,
        referencia=referencia,
        validade=validade,
        dias_destaque=req.dias,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.post("/plano-agente", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def request_plano_agente(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cria referência de pagamento para subscrever o plano agente (mensal)."""
    entidade, referencia, validade = _gerar_referencia_multicaixa()
    payment = Payment(
        utilizador_id=current_user.id,
        tipo=PaymentTipo.PLANO_AGENTE,
        valor=Decimal(str(settings.PLANO_AGENTE_PRECO_MENSAL)),
        status=PaymentStatus.PENDENTE,
        entidade=entidade,
        referencia=referencia,
        validade=validade,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/my", response_model=list[PaymentRead])
def my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Payment)
        .filter(Payment.utilizador_id == current_user.id)
        .order_by(Payment.criado_em.desc())
        .all()
    )


@router.post("/webhook/proxypay", include_in_schema=False)
async def proxypay_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook do ProxyPay — confirmação de pagamento."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payload inválido.")

    referencia = body.get("reference") or body.get("referencia")
    if not referencia:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referência em falta.")

    payment = (
        db.query(Payment)
        .filter(Payment.referencia == str(referencia), Payment.status == PaymentStatus.PENDENTE)
        .first()
    )
    if not payment:
        return {"detail": "Pagamento não encontrado ou já processado."}

    payment.status = PaymentStatus.PAGO
    payment.pago_em = datetime.now(timezone.utc)

    if payment.tipo == PaymentTipo.DESTAQUE and payment.imovel_id and payment.dias_destaque:
        prop = get_property(db, payment.imovel_id)
        if prop:
            apply_destaque(db, prop, int(payment.dias_destaque))

    elif payment.tipo == PaymentTipo.PLANO_AGENTE:
        user = db.query(User).filter(User.id == payment.utilizador_id).first()
        if user:
            base = (
                user.plano_agente_expira_em
                if user.plano_agente_expira_em and user.plano_agente_expira_em > datetime.now(timezone.utc)
                else datetime.now(timezone.utc)
            )
            user.plano_agente_expira_em = base + timedelta(days=30)
            user.role = UserRole.AGENTE
            db.add(user)

    db.add(payment)
    db.commit()
    return {"detail": "Pagamento confirmado."}
