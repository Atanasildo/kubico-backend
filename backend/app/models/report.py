import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.core.database import Base


class ReportReason(str, enum.Enum):
    ANUNCIO_FALSO = "anuncio_falso"
    PRECO_ENGANOSO = "preco_enganoso"
    JA_ARRENDADO_VENDIDO = "ja_arrendado_vendido"
    FOTOS_FALSAS = "fotos_falsas"
    COMPORTAMENTO_ABUSIVO = "comportamento_abusivo"
    SPAM = "spam"
    OUTRO = "outro"


class PropertyReport(Base):
    __tablename__ = "property_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    denunciante_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    imovel_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    motivo = Column(Enum(ReportReason, values_callable=lambda x: [e.value for e in x]), nullable=False)
    descricao = Column(String(1000), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
