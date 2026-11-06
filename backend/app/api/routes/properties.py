import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func as sqlfunc
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

router = APIRouter(prefix="/properties", tags=["Imóveis"])

# ── Limites por plano ─────────────────────────────────────────────────────────
# PARTICULAR (sem plano agente activo):
#   - máximo de anúncios ACTIVOS simultâneos
#   - máximo de anúncios que aparecem no feed Girassol (os restantes ficam só em pesquisa)
# AGENTE (plano activo):
#   - sem limite em nenhum dos dois

_LIMITE_ATIVOS_FREE = 3          # anúncios activos simultâneos
_LIMITE_FEED_FREE = 2            # desses activos, quantos aparecem no Girassol/feed

_DESCRICAO_PLANOS = {
    "free": {
        "nome": "Conta Gratuita",
        "limite_ativos": _LIMITE_ATIVOS_FREE,
        "limite_feed": _LIMITE_FEED_FREE,
        "descricao": (
            f"Contas gratuitas podem ter até {_LIMITE_ATIVOS_FREE} anúncios activos, "
            f"mas apenas {_LIMITE_FEED_FREE} aparecem no feed principal (Girassol). "
            "Os restantes ficam visíveis apenas em pesquisa directa. "
            "Subscreve o plano Agente para anúncios ilimitados e destaque no feed."
        ),
    },
    "agente": {
        "nome": "Plano Agente",
        "limite_ativos": None,
        "limite_feed": None,
        "descricao": "Anúncios ilimitados, todos visíveis no feed Girassol.",
    },
}


def _is_agente_ativo(user: User) -> bool:
    """Devolve True se o utilizador tem plano agente activo."""
    if user.role == UserRole.AGENTE:
        return True
    if user.plano_agente_expira_em:
        exp = user.plano_agente_expira_em
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        return exp > datetime.now(timezone.utc)
    return False


# ── Endpoint de limites ───────────────────────────────────────────────────────

@router.get("/limits", tags=["Imóveis"])
def get_my_limits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna os limites de publicação da conta autenticada e o uso actual.

    Use este endpoint para mostrar ao utilizador quantos anúncios pode ainda
    publicar e quantos aparecem no feed Girassol.
    """
    agente = _is_agente_ativo(current_user)
    plano_key = "agente" if agente else "free"
    info = _DESCRICAO_PLANOS[plano_key]

    # Contagens actuais
    total_ativos = (
        db.query(sqlfunc.count(Property.id))
        .filter(
            Property.autor_id == current_user.id,
            Property.status == PropertyStatus.ATIVO,
        )
        .scalar()
    ) or 0

    no_feed = (
        db.query(sqlfunc.count(Property.id))
        .filter(
            Property.autor_id == current_user.id,
            Property.status == PropertyStatus.ATIVO,
            Property.aparece_no_feed == True,  # noqa: E712
        )
        .scalar()
    ) or 0

    return {
        "plano": info["nome"],
        "descricao_plano": info["descricao"],
        "limites": {
            "max_ativos": info["limite_ativos"],       # None = ilimitado
            "max_feed_girassol": info["limite_feed"],  # None = ilimitado
        },
        "uso_actual": {
            "ativos": total_ativos,
            "no_feed_girassol": no_feed,
            "apenas_em_pesquisa": total_ativos - no_feed,
        },
        "pode_publicar": agente or total_ativos < _LIMITE_ATIVOS_FREE,
        "slots_ativos_restantes": (
            None if agente else max(0, _LIMITE_ATIVOS_FREE - total_ativos)
        ),
        "slots_feed_restantes": (
            None if agente else max(0, _LIMITE_FEED_FREE - no_feed)
        ),
    }


# ── Publicar anúncio ─────────────────────────────────────────────────────────

@router.post("/", response_model=PropertyRead, status_code=status.HTTP_201_CREATED)
def publish_property(
    prop_in: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Publicar um novo anúncio de imóvel.

    Contas gratuitas estão limitadas a {_LIMITE_ATIVOS_FREE} anúncios activos simultâneos.
    Dos anúncios activos, apenas {_LIMITE_FEED_FREE} aparecem no feed Girassol —
    os restantes ficam disponíveis apenas em pesquisa directa.
    Subscreve o plano Agente para anúncios ilimitados.
    """
    agente = _is_agente_ativo(current_user)

    if not agente:
        ativos = count_active_by_author(db, current_user.id)
        if ativos >= _LIMITE_ATIVOS_FREE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Limite de {_LIMITE_ATIVOS_FREE} anúncios activos para contas gratuitas. "
                    "Subscreve o plano Agente para publicar sem limite."
                ),
            )

    imovel = create_property(db, prop_in, autor_id=current_user.id)

    # Admin e agentes verificados têm aprovação automática
    if current_user.role in (UserRole.ADMIN, UserRole.AGENTE) or agente:
        imovel.aprovado = True
        db.commit()
        db.refresh(imovel)

    # Visibilidade no feed Girassol para utilizadores free
    if not agente:
        count_feed = (
            db.query(sqlfunc.count(Property.id))
            .filter(
                Property.autor_id == current_user.id,
                Property.aparece_no_feed == True,  # noqa: E712
                Property.status == PropertyStatus.ATIVO,
            )
            .scalar()
        ) or 0

        if count_feed > _LIMITE_FEED_FREE:
            imovel.aparece_no_feed = False
            db.commit()
            db.refresh(imovel)

    return imovel


# ── Pesquisa ─────────────────────────────────────────────────────────────────

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
    """Pesquisar imóveis — inclui anúncios de contas free que não aparecem no feed."""
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
    """Painel de desempenho — visualizações, favoritos, contactos."""
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


# ── Disponibilidade / estado do anúncio ──────────────────────────────────────

class PropertyStatusUpdate(BaseModel):
    status: PropertyStatus


@router.patch("/{property_id}/status", response_model=PropertyRead)
def atualizar_status_imovel(
    property_id: uuid.UUID,
    body: PropertyStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Dono do anúncio atualiza a disponibilidade:

    - **ativo** → disponível para venda / arrendamento
    - **vendido** → imóvel vendido (anúncio mantém-se mas fica inativo)
    - **arrendado** → imóvel arrendado
    - **suspenso** → suspenso pelo dono ou por moderação

    Só o dono ou um admin podem alterar.
    """
    imovel = db.query(Property).filter(Property.id == property_id).first()
    if not imovel:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    if imovel.autor_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Sem permissão.")

    imovel.status = body.status

    # Se o anúncio deixa de estar activo, retira-o do feed
    if body.status != PropertyStatus.ATIVO:
        imovel.aparece_no_feed = False
    else:
        # Ao reativar, repor feed conforme o plano
        agente = _is_agente_ativo(current_user)
        if agente:
            imovel.aparece_no_feed = True
        else:
            count_feed = (
                db.query(sqlfunc.count(Property.id))
                .filter(
                    Property.autor_id == current_user.id,
                    Property.aparece_no_feed == True,  # noqa: E712
                    Property.status == PropertyStatus.ATIVO,
                    Property.id != property_id,
                )
                .scalar()
            ) or 0
            imovel.aparece_no_feed = count_feed < _LIMITE_FEED_FREE

    db.commit()
    db.refresh(imovel)
    return imovel
