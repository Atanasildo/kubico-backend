import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_user_optional
from app.core.config import settings
from app.core.database import get_db
from app.crud.interaction import count_favorites, list_leads_for_property
from app.crud.property import (
    apply_destaque,
    count_active_by_author,
    create_property,
    delete_property,
    get_property,
    increment_views,
    list_properties_by_author,
    search_properties,
    update_property,
)
from app.models.property import Property, PropertyStatus, TipoImovel, TipoNegocio
from app.models.user import User, UserRole
from app.schemas.interaction import PropertyAnalytics
from app.schemas.property import PropertyCreate, PropertyListItem, PropertyRead, PropertyUpdate
from pydantic import BaseModel

router = APIRouter(prefix="/properties", tags=["Imóveis"])

# Particulares sem plano agente: limite de anúncios activos simultâneos
_LIMITE_ANUNCIOS_PARTICULAR = 2
_LIMITE_ANUNCIOS_FEED_PARTICULAR = 3   # máximo de anúncios no feed girassol (free)


@router.post("/", response_model=PropertyRead, status_code=status.HTTP_201_CREATED)
def publish_property(
    prop_in: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Publicar um novo anúncio de imóvel.

    Particulares sem plano agente activo estão limitados a 2 anúncios
    simultâneos activos — incentivo natural para o plano de agente.
    """
    if current_user.role == UserRole.PARTICULAR:
        ativos = count_active_by_author(db, current_user.id)
        if ativos >= _LIMITE_ANUNCIOS_PARTICULAR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Limite de {_LIMITE_ANUNCIOS_PARTICULAR} anúncios activos para contas particulares. "
                    "Subscreva o plano agente para anúncios ilimitados."
                ),
            )
    imovel = create_property(db, prop_in, autor_id=current_user.id)

    # Lógica de visibilidade no feed para utilizadores free
    from app.models.user import UserRole
    from sqlalchemy import func as sqlfunc
    if current_user.role == UserRole.PARTICULAR:
        count_feed = (
            db.query(sqlfunc.count(Property.id))
            .filter(
                Property.autor_id == current_user.id,
                Property.aparece_no_feed == True,  # noqa: E712
                Property.status == PropertyStatus.ATIVO,
            )
            .scalar()
        ) or 0
        if count_feed > _LIMITE_ANUNCIOS_FEED_PARTICULAR:
            imovel.aparece_no_feed = False
            db.commit()
            db.refresh(imovel)

    return imovel


@router.get("/", response_model=list[PropertyListItem])
def search(
    tipo_negocio: TipoNegocio | None = Query(default=None),
    tipo_imovel: TipoImovel | None = Query(default=None),
    provincia: str | None = Query(default=None),
    municipio: str | None = Query(default=None),
    bairro: str | None = Query(default=None),
    preco_min: Decimal | None = Query(default=None, gt=0),
    preco_max: Decimal | None = Query(default=None, gt=0),
    quartos_min: int | None = Query(default=None, ge=0),
    q: str | None = Query(default=None, max_length=200),
    apenas_verificados: bool = Query(default=False),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Pesquisar imóveis com filtros — o endpoint principal da app."""
    return search_properties(
        db,
        tipo_negocio=tipo_negocio,
        tipo_imovel=tipo_imovel,
        provincia=provincia,
        municipio=municipio,
        bairro=bairro,
        preco_min=preco_min,
        preco_max=preco_max,
        quartos_min=quartos_min,
        q=q,
        apenas_verificados=apenas_verificados,
        skip=skip,
        limit=limit,
    )


@router.get("/me", response_model=list[PropertyRead])
def my_properties(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_properties_by_author(db, current_user.id)


@router.get("/{property_id}", response_model=PropertyRead)
def read_property(
    property_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    db_prop = get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")
    # Não contar visualização do próprio autor
    if not current_user or current_user.id != db_prop.autor_id:
        increment_views(db, db_prop)
    return db_prop


@router.put("/{property_id}", response_model=PropertyRead)
def edit_property(
    property_id: uuid.UUID,
    prop_in: PropertyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_prop = get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")
    if db_prop.autor_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão.")
    return update_property(db, db_prop, prop_in)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_property(
    property_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_prop = get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")
    if db_prop.autor_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão.")
    delete_property(db, db_prop)


@router.get("/{property_id}/analytics", response_model=PropertyAnalytics)
def property_analytics(
    property_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Painel de desempenho do anúncio — visto, favoritado, contactado quantas vezes."""
    db_prop = get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")
    if db_prop.autor_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão.")

    leads = list_leads_for_property(db, property_id)
    leads_por_canal: dict[str, int] = {}
    for lead in leads:
        leads_por_canal[lead.canal.value] = leads_por_canal.get(lead.canal.value, 0) + 1

    return PropertyAnalytics(
        imovel_id=property_id,
        visualizacoes=db_prop.visualizacoes,
        total_favoritos=count_favorites(db, property_id),
        total_leads=len(leads),
        leads_por_canal=leads_por_canal,
    )


class PropertyStatusUpdate(BaseModel):
    status: PropertyStatus


@router.patch("/{property_id}/status", response_model=PropertyRead)
async def atualizar_status_imovel(
    property_id: uuid.UUID,
    body: PropertyStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dono do anúncio marca como disponível, arrendado, vendido ou suspenso."""
    imovel = db.query(Property).filter(Property.id == property_id).first()
    if not imovel:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    if imovel.autor_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão.")

    imovel.status = body.status
    db.commit()
    db.refresh(imovel)
    return imovel
