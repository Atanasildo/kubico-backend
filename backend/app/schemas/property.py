import html
import re
import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

from app.models.property import PropertyStatus, TipoImovel, TipoNegocio
from app.schemas.user import UserPublicRead

_ALLOWED_MOEDAS = {"AOA", "USD"}

# Remove tags HTML e escapa entidades — previne XSS armazenado
def _strip_html(value: str | None) -> str | None:
    if value is None:
        return None
    # remover tags HTML
    clean = re.sub(r"<[^>]+>", "", value)
    # escapar entidades residuais
    return html.escape(clean.strip())


class PropertyBase(BaseModel):
    titulo: str = Field(min_length=5, max_length=150)
    descricao: str | None = Field(default=None, max_length=3000)
    tipo_negocio: TipoNegocio
    tipo_imovel: TipoImovel
    preco: Decimal = Field(gt=0)
    moeda: str = Field(default="AOA", max_length=3)
    provincia: str = Field(min_length=2, max_length=100)
    municipio: str = Field(min_length=2, max_length=100)
    bairro: str | None = Field(default=None, max_length=150)
    endereco_referencia: str | None = Field(default=None, max_length=300)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    area_m2: Decimal | None = Field(default=None, gt=0)
    quartos: int | None = Field(default=None, ge=0, le=50)
    casas_banho: int | None = Field(default=None, ge=0, le=50)
    mobilado: bool | None = None
    tem_garagem: bool = False
    tem_quintal: bool = False
    tem_cozinha: bool = False
    tem_sala: bool = False
    tem_varanda: bool = False
    tem_wc_servico: bool = False
    tem_piscina: bool = False
    tem_gerador: bool = False
    tem_seguranca: bool = False
    tem_elevador: bool = False
    andares: int | None = Field(default=None, ge=0, le=200)
    contacto_telefone: str | None = Field(default=None, max_length=30)
    contacto_whatsapp: str | None = Field(default=None, max_length=30)

    @field_validator("titulo")
    @classmethod
    def _sanitize_titulo(cls, v: str) -> str:
        return _strip_html(v) or v

    @field_validator("descricao")
    @classmethod
    def _sanitize_descricao(cls, v: str | None) -> str | None:
        return _strip_html(v)

    @field_validator("moeda")
    @classmethod
    def _validate_moeda(cls, v: str) -> str:
        v = v.upper()
        if v not in _ALLOWED_MOEDAS:
            raise ValueError(f"Moeda deve ser uma de: {', '.join(sorted(_ALLOWED_MOEDAS))}")
        return v


class PropertyCreate(PropertyBase):
    imagens: list[str] = Field(default_factory=list, max_length=20)
    videos: list[str] = Field(default_factory=list, max_length=3)


class PropertyUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=5, max_length=150)
    descricao: str | None = Field(default=None, max_length=3000)
    preco: Decimal | None = Field(default=None, gt=0)
    moeda: str | None = Field(default=None, max_length=3)
    bairro: str | None = Field(default=None, max_length=150)
    endereco_referencia: str | None = Field(default=None, max_length=300)
    area_m2: Decimal | None = Field(default=None, gt=0)
    quartos: int | None = Field(default=None, ge=0, le=50)
    casas_banho: int | None = Field(default=None, ge=0, le=50)
    mobilado: bool | None = None
    tem_garagem: bool | None = None
    tem_quintal: bool | None = None
    tem_cozinha: bool | None = None
    tem_sala: bool | None = None
    tem_varanda: bool | None = None
    tem_wc_servico: bool | None = None
    tem_piscina: bool | None = None
    tem_gerador: bool | None = None
    tem_seguranca: bool | None = None
    tem_elevador: bool | None = None
    andares: int | None = Field(default=None, ge=0, le=200)
    imagens: list[str] | None = Field(default=None, max_length=20)
    videos: list[str] | None = Field(default=None, max_length=3)
    contacto_telefone: str | None = Field(default=None, max_length=30)
    contacto_whatsapp: str | None = Field(default=None, max_length=30)
    status: PropertyStatus | None = None

    @field_validator("titulo")
    @classmethod
    def _sanitize_titulo(cls, v: str | None) -> str | None:
        return _strip_html(v) if v else v

    @field_validator("descricao")
    @classmethod
    def _sanitize_descricao(cls, v: str | None) -> str | None:
        return _strip_html(v)

    @field_validator("moeda")
    @classmethod
    def _validate_moeda(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.upper()
        if v not in _ALLOWED_MOEDAS:
            raise ValueError(f"Moeda deve ser uma de: {', '.join(sorted(_ALLOWED_MOEDAS))}")
        return v


class PropertyRead(PropertyBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    autor_id: uuid.UUID
    imagens: list[str] | None = None
    videos: list[str] | None = None
    status: PropertyStatus
    verificado: bool
    destaque_ate: datetime | None = None
    visualizacoes: int
    criado_em: datetime
    autor: UserPublicRead | None = None

    @computed_field
    @property
    def em_destaque(self) -> bool:
        return self.destaque_ate is not None and self.destaque_ate > datetime.now(self.destaque_ate.tzinfo)


class PropertyListItem(BaseModel):
    """Versão leve para listagens — sem descrição completa nem autor embebido."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    titulo: str
    tipo_negocio: TipoNegocio
    tipo_imovel: TipoImovel
    preco: Decimal
    moeda: str
    provincia: str
    municipio: str
    bairro: str | None = None
    area_m2: Decimal | None = None
    quartos: int | None = None
    casas_banho: int | None = None
    imagens: list[str] | None = None
    status: PropertyStatus
    verificado: bool
    destaque_ate: datetime | None = None
    criado_em: datetime
