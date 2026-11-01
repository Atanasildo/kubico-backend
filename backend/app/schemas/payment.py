import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.payment import PaymentStatus, PaymentTipo


class DestaqueRequest(BaseModel):
    imovel_id: uuid.UUID
    dias: int = Field(description="7, 15 ou 30 dias")


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    utilizador_id: uuid.UUID
    imovel_id: uuid.UUID | None = None
    tipo: PaymentTipo
    valor: Decimal
    status: PaymentStatus
    entidade: str | None = None
    referencia: str | None = None
    validade: datetime | None = None
    dias_destaque: Decimal | None = None
    criado_em: datetime
    pago_em: datetime | None = None
