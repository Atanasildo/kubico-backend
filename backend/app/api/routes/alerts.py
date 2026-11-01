"""Rotas de alertas de pesquisa — 'avisa-me quando surgir T3 em Talatona'."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.crud.interaction import (
    create_search_alert,
    delete_search_alert,
    list_search_alerts,
)
from app.models.user import User
from app.schemas.interaction import SearchAlertCreate, SearchAlertRead

router = APIRouter(prefix="/alerts", tags=["Alertas de Pesquisa"])


@router.post("/", response_model=SearchAlertRead, status_code=status.HTTP_201_CREATED)
def create_alert(
    alert_in: SearchAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_search_alert(db, alert_in, current_user.id)


@router.get("/", response_model=list[SearchAlertRead])
def my_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_search_alerts(db, current_user.id)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.search_alert import SearchAlert

    alert = db.query(SearchAlert).filter(
        SearchAlert.id == alert_id,
        SearchAlert.utilizador_id == current_user.id,
    ).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado.")
    delete_search_alert(db, alert)
