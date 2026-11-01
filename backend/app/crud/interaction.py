import uuid

from sqlalchemy.orm import Session

from app.models.favorite import Favorite
from app.models.lead import Lead
from app.models.report import PropertyReport
from app.models.search_alert import SearchAlert
from app.schemas.interaction import LeadCreate, ReportCreate, SearchAlertCreate


def toggle_favorite(db: Session, utilizador_id: uuid.UUID, imovel_id: uuid.UUID) -> bool:
    """Retorna True se agora está favoritado, False se foi removido."""
    existing = (
        db.query(Favorite)
        .filter(Favorite.utilizador_id == utilizador_id, Favorite.imovel_id == imovel_id)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return False

    fav = Favorite(utilizador_id=utilizador_id, imovel_id=imovel_id)
    db.add(fav)
    db.commit()
    return True


def list_favorites(db: Session, utilizador_id: uuid.UUID) -> list[Favorite]:
    return (
        db.query(Favorite)
        .filter(Favorite.utilizador_id == utilizador_id)
        .order_by(Favorite.criado_em.desc())
        .all()
    )


def count_favorites(db: Session, imovel_id: uuid.UUID) -> int:
    return db.query(Favorite).filter(Favorite.imovel_id == imovel_id).count()


def create_lead(
    db: Session, lead_in: LeadCreate, imovel_id: uuid.UUID, interessado_id: uuid.UUID | None
) -> Lead:
    db_lead = Lead(
        imovel_id=imovel_id,
        interessado_id=interessado_id,
        **lead_in.model_dump(),
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead


def list_leads_for_property(db: Session, imovel_id: uuid.UUID) -> list[Lead]:
    return (
        db.query(Lead)
        .filter(Lead.imovel_id == imovel_id)
        .order_by(Lead.criado_em.desc())
        .all()
    )


def create_search_alert(db: Session, alert_in: SearchAlertCreate, utilizador_id: uuid.UUID) -> SearchAlert:
    db_alert = SearchAlert(utilizador_id=utilizador_id, **alert_in.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


def list_search_alerts(db: Session, utilizador_id: uuid.UUID) -> list[SearchAlert]:
    return (
        db.query(SearchAlert)
        .filter(SearchAlert.utilizador_id == utilizador_id)
        .order_by(SearchAlert.criado_em.desc())
        .all()
    )


def delete_search_alert(db: Session, db_alert: SearchAlert) -> None:
    db.delete(db_alert)
    db.commit()


def create_report(db: Session, report_in: ReportCreate, imovel_id: uuid.UUID, denunciante_id: uuid.UUID) -> PropertyReport:
    db_report = PropertyReport(
        imovel_id=imovel_id,
        denunciante_id=denunciante_id,
        **report_in.model_dump(),
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report
