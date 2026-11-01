import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class LeadCanal(str, enum.Enum):
    WHATSAPP = "whatsapp"
    TELEFONE = "telefone"
    CHAT_INTERNO = "chat_interno"


class Lead(Base):
    """Registo de 'mostrar interesse' — alimenta o painel de analytics do anunciante."""

    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    imovel_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    interessado_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    nome_interessado = Column(String(150), nullable=True)   # caso não autenticado
    contacto_interessado = Column(String(50), nullable=True)
    canal = Column(Enum(LeadCanal, values_callable=lambda x: [e.value for e in x]), nullable=False)
    mensagem = Column(String(500), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    imovel = relationship("Property", back_populates="leads")
