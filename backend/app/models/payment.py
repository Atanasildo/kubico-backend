import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.core.database import Base


class PaymentTipo(str, enum.Enum):
    DESTAQUE = "destaque"            # destacar um anúncio
    PLANO_AGENTE = "plano_agente"    # subscrição mensal de agente
    VERIFICACAO = "verificacao"      # pedido de verificação presencial do imóvel


class PaymentStatus(str, enum.Enum):
    PENDENTE = "pendente"
    PAGO = "pago"
    FALHADO = "falhado"
    REEMBOLSADO = "reembolsado"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    utilizador_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    imovel_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="SET NULL"), nullable=True)

    tipo = Column(Enum(PaymentTipo, values_callable=lambda x: [e.value for e in x]), nullable=False)
    valor = Column(Numeric(14, 2), nullable=False)
    status = Column(Enum(PaymentStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=PaymentStatus.PENDENTE)

    # Referência Multicaixa (estilo RPS — gateway ProxyPay sandbox)
    entidade = Column(String(10), nullable=True)
    referencia = Column(String(20), nullable=True)
    validade = Column(DateTime(timezone=True), nullable=True)
    gateway_ref = Column(String(200), nullable=True)

    dias_destaque = Column(Numeric(4, 0), nullable=True)  # 7, 15 ou 30 dias

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    pago_em = Column(DateTime(timezone=True), nullable=True)
