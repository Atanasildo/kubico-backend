import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.property import Property, PropertyStatus, TipoImovel, TipoNegocio
from app.schemas.property import PropertyCreate, PropertyUpdate


def create_property(db: Session, prop_in: PropertyCreate, autor_id: uuid.UUID) -> Property:
    db_prop = Property(
        autor_id=autor_id,
        **prop_in.model_dump(),
    )
    db.add(db_prop)
    db.commit()
    db.refresh(db_prop)
    return db_prop


def get_property(db: Session, property_id: uuid.UUID) -> Property | None:
    return db.query(Property).filter(Property.id == property_id).first()


def increment_views(db: Session, db_prop: Property) -> None:
    db_prop.visualizacoes += 1
    db.add(db_prop)
    db.commit()


def update_property(db: Session, db_prop: Property, prop_in: PropertyUpdate) -> Property:
    update_data = prop_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_prop, field, value)
    db.add(db_prop)
    db.commit()
    db.refresh(db_prop)
    return db_prop


def delete_property(db: Session, db_prop: Property) -> None:
    db.delete(db_prop)
    db.commit()


def apply_destaque(db: Session, db_prop: Property, dias: int) -> Property:
    base = db_prop.destaque_ate if db_prop.destaque_ate and db_prop.destaque_ate > datetime.now(timezone.utc) else datetime.now(timezone.utc)
    db_prop.destaque_ate = base + timedelta(days=dias)
    db.add(db_prop)
    db.commit()
    db.refresh(db_prop)
    return db_prop


def search_properties(
    db: Session,
    *,
    tipo_negocio: TipoNegocio | None = None,
    tipo_imovel: TipoImovel | None = None,
    provincia: str | None = None,
    municipio: str | None = None,
    bairro: str | None = None,
    preco_min: Decimal | None = None,
    preco_max: Decimal | None = None,
    quartos_min: int | None = None,
    q: str | None = None,
    apenas_verificados: bool = False,
    skip: int = 0,
    limit: int = 20,
) -> list[Property]:
    query = db.query(Property).filter(
        Property.status == PropertyStatus.ATIVO,
        Property.aprovado == True,  # noqa: E712
    )

    if tipo_negocio:
        query = query.filter(Property.tipo_negocio == tipo_negocio)
    if tipo_imovel:
        query = query.filter(Property.tipo_imovel == tipo_imovel)
    if provincia:
        query = query.filter(Property.provincia.ilike(provincia))
    if municipio:
        query = query.filter(Property.municipio.ilike(municipio))
    if bairro:
        query = query.filter(Property.bairro.ilike(f"%{bairro}%"))
    if preco_min is not None:
        query = query.filter(Property.preco >= preco_min)
    if preco_max is not None:
        query = query.filter(Property.preco <= preco_max)
    if quartos_min is not None:
        query = query.filter(Property.quartos >= quartos_min)
    if apenas_verificados:
        query = query.filter(Property.verificado == True)  # noqa: E712
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Property.titulo.ilike(like), Property.descricao.ilike(like)))

    now = datetime.now(timezone.utc)
    # Destaques activos primeiro, depois mais recentes
    query = query.order_by(
        (Property.destaque_ate.isnot(None) & (Property.destaque_ate > now)).desc(),
        Property.criado_em.desc(),
    )

    return query.offset(skip).limit(limit).all()


def list_properties_by_author(db: Session, autor_id: uuid.UUID) -> list[Property]:
    return (
        db.query(Property)
        .filter(Property.autor_id == autor_id)
        .order_by(Property.criado_em.desc())
        .all()
    )


def count_active_by_author(db: Session, autor_id: uuid.UUID) -> int:
    return (
        db.query(Property)
        .filter(Property.autor_id == autor_id, Property.status == PropertyStatus.ATIVO)
        .count()
    )
