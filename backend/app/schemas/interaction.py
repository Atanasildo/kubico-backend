import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.lead import LeadCanal
from app.models.report import ReportReason
from app.schemas.property import PropertyListItem


class FavoriteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    imovel_id: uuid.UUID
    criado_em: datetime
    imovel: PropertyListItem | None = None


class LeadCreate(BaseModel):
    canal: LeadCanal
    nome_interessado: str | None = Field(default=None, max_length=150)
    contacto_interessado: str | None = Field(default=None, max_length=50)
    mensagem: str | None = Field(default=None, max_length=500)


class LeadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    imovel_id: uuid.UUID
    nome_interessado: str | None = None
    contacto_interessado: str | None = None
    canal: LeadCanal
    mensagem: str | None = None
    criado_em: datetime


class SearchAlertCreate(BaseModel):
    tipo_negocio: str | None = None
    tipo_imovel: str | None = None
    provincia: str | None = None
    municipio: str | None = None
    bairro: str | None = None
    preco_max: Decimal | None = Field(default=None, gt=0)
    quartos_min: int | None = Field(default=None, ge=0, le=50)


class SearchAlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tipo_negocio: str | None = None
    tipo_imovel: str | None = None
    provincia: str | None = None
    municipio: str | None = None
    bairro: str | None = None
    preco_max: Decimal | None = None
    quartos_min: int | None = None
    ativo: bool
    criado_em: datetime


class ReportCreate(BaseModel):
    motivo: ReportReason
    descricao: str | None = Field(default=None, max_length=1000)


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    imovel_id: uuid.UUID
    motivo: ReportReason
    descricao: str | None = None
    criado_em: datetime


class PropertyAnalytics(BaseModel):
    """Painel de analytics por imóvel, para o anunciante."""
    imovel_id: uuid.UUID
    visualizacoes: int
    total_favoritos: int
    total_leads: int
    leads_por_canal: dict[str, int]
