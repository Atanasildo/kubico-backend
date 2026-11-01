"""Rotas de administração — moderação de imóveis e gestão de utilizadores."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.crud.property import get_property
from app.models.property import Property, PropertyStatus
from app.models.report import PropertyReport
from app.models.user import User, UserRole
from app.schemas.property import PropertyRead

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/properties/pending", response_model=list[PropertyRead])
def list_pending_properties(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Lista imóveis pendentes de aprovação."""
    return (
        db.query(Property)
        .filter(Property.aprovado == False)  # noqa: E712
        .order_by(Property.criado_em.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/properties/{property_id}/approve", response_model=PropertyRead)
def approve_property(
    property_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    db_prop = get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")
    db_prop.aprovado = True
    db_prop.flagged = False
    db_prop.flag_reason = None
    db.add(db_prop)
    db.commit()
    db.refresh(db_prop)
    return db_prop


@router.post("/properties/{property_id}/suspend", response_model=PropertyRead)
def suspend_property(
    property_id: uuid.UUID,
    reason: str = Query(default="Suspendido por moderação."),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    db_prop = get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")
    db_prop.status = PropertyStatus.SUSPENSO
    db_prop.flagged = True
    db_prop.flag_reason = reason
    db.add(db_prop)
    db.commit()
    db.refresh(db_prop)
    return db_prop


@router.post("/properties/{property_id}/verify", response_model=PropertyRead)
def verify_property(
    property_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Marca imóvel como verificado presencialmente — selo de confiança."""
    db_prop = get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")
    db_prop.verificado = True
    db.add(db_prop)
    db.commit()
    db.refresh(db_prop)
    return db_prop


@router.get("/reports", tags=["Admin"])
def list_reports(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Lista denúncias pendentes de revisão."""
    reports = (
        db.query(PropertyReport)
        .order_by(PropertyReport.criado_em.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "id": str(r.id),
            "imovel_id": str(r.imovel_id),
            "denunciante_id": str(r.denunciante_id),
            "motivo": r.motivo.value,
            "descricao": r.descricao,
            "criado_em": r.criado_em.isoformat() if r.criado_em else None,
        }
        for r in reports
    ]


@router.post("/users/{user_id}/deactivate", status_code=status.HTTP_200_OK)
def deactivate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilizador não encontrado.")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não podes desactivar a tua conta.")
    user.ativo = False
    db.add(user)
    db.commit()
    return {"detail": "Utilizador desactivado."}
