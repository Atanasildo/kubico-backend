import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(str, enum.Enum):
    PARTICULAR = "particular"       # pessoa comum, publica/procura imóveis
    AGENTE = "agente"                # agente imobiliário, plano pago, anúncios ilimitados
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    nome = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    telefone = Column(String(30), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)

    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]), nullable=False, default=UserRole.PARTICULAR)

    # Localização
    provincia = Column(String(100), nullable=True)
    municipio = Column(String(100), nullable=True)

    foto_perfil_url = Column(String(500), nullable=True)
    bio = Column(String(500), nullable=True)

    # Empresa (para agentes)
    nome_empresa = Column(String(150), nullable=True)

    # Verificações
    email_verificado = Column(Boolean, default=False, nullable=False)
    telefone_verificado = Column(Boolean, default=False, nullable=False)

    # Plano agente — anúncios ilimitados até esta data
    plano_agente_expira_em = Column(DateTime(timezone=True), nullable=True)

    ativo = Column(Boolean, default=True, nullable=False)
    fcm_token = Column(String(512), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    imoveis = relationship("Property", back_populates="autor", cascade="all, delete-orphan")
    favoritos = relationship("Favorite", back_populates="utilizador", cascade="all, delete-orphan")
    alertas = relationship("SearchAlert", back_populates="utilizador", cascade="all, delete-orphan")
