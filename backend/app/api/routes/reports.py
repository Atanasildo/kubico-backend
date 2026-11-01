"""Rotas de denúncias de anúncios falsos."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.crud.interaction import create_report
from app.crud.property import get_property
from app.models.user import User, UserRole
from app.schemas.interaction import ReportCreate, ReportRead

router = APIRouter(prefix="/properties", tags=["Denúncias"])


@router.post("/{property_id}/report", response_model=ReportRead, status_code=status.HTTP_201_CREATED)
def report_property(
    property_id: uuid.UUID,
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Denunciar um anúncio suspeito ou falso."""
    db_prop = get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")
    if db_prop.autor_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não podes denunciar o teu próprio anúncio.",
        )
    return create_report(db, report_in, property_id, current_user.id)
