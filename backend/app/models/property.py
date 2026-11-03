import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TipoNegocio(str, enum.Enum):
    ARRENDAMENTO = "arrendamento"
    VENDA = "venda"


class TipoImovel(str, enum.Enum):
    APARTAMENTO = "apartamento"
    CASA = "casa"
    TERRENO = "terreno"
    LOJA = "loja"
    ESCRITORIO = "escritorio"
    ARMAZEM = "armazem"
    QUARTO = "quarto"          # quarto para arrendar dentro de casa partilhada
    OUTRO = "outro"


class PropertyStatus(str, enum.Enum):
    ATIVO = "ativo"
    ARRENDADO = "arrendado"
    VENDIDO = "vendido"
    SUSPENSO = "suspenso"      # suspenso por moderação/denúncia


class Property(Base):
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    autor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    titulo = Column(String(150), nullable=False)
    descricao = Column(Text, nullable=True)

    tipo_negocio = Column(Enum(TipoNegocio, values_callable=lambda x: [e.value for e in x]), nullable=False)
    tipo_imovel = Column(Enum(TipoImovel, values_callable=lambda x: [e.value for e in x]), nullable=False)

    preco = Column(Numeric(14, 2), nullable=False)
    moeda = Column(String(3), nullable=False, default="AOA")  # AOA ou USD

    # Localização
    provincia = Column(String(100), nullable=False, index=True)
    municipio = Column(String(100), nullable=False, index=True)
    bairro = Column(String(150), nullable=True, index=True)
    endereco_referencia = Column(String(300), nullable=True)  # "perto do mercado X"
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)

    # Características
    area_m2 = Column(Numeric(10, 2), nullable=True)
    quartos = Column(Integer, nullable=True)
    casas_banho = Column(Integer, nullable=True)
    mobilado = Column(Boolean, nullable=True)
    tem_garagem = Column(Boolean, default=False)
    tem_quintal = Column(Boolean, default=False)
    tem_cozinha = Column(Boolean, default=False)
    tem_sala = Column(Boolean, default=False)
    tem_varanda = Column(Boolean, default=False)
    tem_wc_servico = Column(Boolean, default=False)  # WC de serviço separado
    tem_piscina = Column(Boolean, default=False)
    tem_gerador = Column(Boolean, default=False)
    tem_seguranca = Column(Boolean, default=False)
    tem_elevador = Column(Boolean, default=False)
    andares = Column(Integer, nullable=True)

    # Mídia
    imagens = Column(ARRAY(String), nullable=True, default=list)
    videos = Column(ARRAY(String), nullable=True, default=list)

    # Contacto
    contacto_telefone = Column(String(30), nullable=True)
    contacto_whatsapp = Column(String(30), nullable=True)

    status = Column(Enum(PropertyStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=PropertyStatus.ATIVO)

    # Moderação / confiança
    verificado = Column(Boolean, default=False, nullable=False)  # equipa foi ao local
    aprovado = Column(Boolean, default=True, nullable=False)
    flagged = Column(Boolean, default=False, nullable=False)
    flag_reason = Column(String(500), nullable=True)

    # Destaque pago — aparece no topo das pesquisas
    destaque_ate = Column(DateTime(timezone=True), nullable=True)

    # Métricas
    visualizacoes = Column(Integer, default=0, nullable=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    autor = relationship("User", back_populates="imoveis")
    favoritado_por = relationship("Favorite", back_populates="imovel", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="imovel", cascade="all, delete-orphan")
