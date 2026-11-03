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


@router.post("/{property_id}/report", status_code=status.HTTP_201_CREATED)
def report_property(
    property_id: uuid.UUID,
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Denunciar um anúncio suspeito ou falso."""
    import logging
    from sqlalchemy.exc import IntegrityError

    logger = logging.getLogger(__name__)

    db_prop = get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")
    if db_prop.autor_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não podes denunciar o teu próprio anúncio.",
        )
    try:
        report = create_report(db, report_in, property_id, current_user.id)
        return {"id": str(report.id), "imovel_id": str(report.imovel_id), "motivo": report.motivo, "descricao": report.descricao, "criado_em": report.criado_em.isoformat() if report.criado_em else None}
    except IntegrityError as exc:
        db.rollback()
        logger.error("IntegrityError ao criar denúncia: %s", exc)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já denunciaste este anúncio anteriormente.")
    except Exception as exc:
        db.rollback()
        logger.error("Erro ao criar denúncia: %s", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao registar denúncia.")
