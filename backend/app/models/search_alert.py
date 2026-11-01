import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class SearchAlert(Base):
    """Alerta: 'avisa-me quando aparecer T3 em Talatona abaixo de 800 USD'."""

    __tablename__ = "search_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    utilizador_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    tipo_negocio = Column(String(20), nullable=True)
    tipo_imovel = Column(String(20), nullable=True)
    provincia = Column(String(100), nullable=True)
    municipio = Column(String(100), nullable=True)
    bairro = Column(String(150), nullable=True)
    preco_max = Column(Numeric(14, 2), nullable=True)
    quartos_min = Column(Numeric(3, 0), nullable=True)

    ativo = Column(Boolean, default=True, nullable=False)
    ultima_notificacao_em = Column(DateTime(timezone=True), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    utilizador = relationship("User", back_populates="alertas")
