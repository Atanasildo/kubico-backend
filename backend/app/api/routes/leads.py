import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_optional
from app.core.database import get_db
from app.crud.interaction import create_lead
from app.crud.property import get_property
from app.models.lead import LeadCanal
from app.models.user import User
from app.schemas.interaction import LeadCreate, LeadRead
from app.utils.whatsapp import build_whatsapp_link

router = APIRouter(prefix="/properties", tags=["Interesse / Leads"])


@router.post("/{property_id}/interesse", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def show_interest(
    property_id: uuid.UUID,
    lead_in: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Regista 'mostrar interesse' — funciona autenticado ou anónimo (visitante).

    Se o canal for WhatsApp, o anúncio inclui o link pronto na resposta
    para o frontend redirecionar imediatamente.
    """
    db_prop = get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")

    if not current_user and not lead_in.contacto_interessado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Indique um contacto para que o anunciante possa responder.",
        )

    lead = create_lead(db, lead_in, imovel_id=property_id, interessado_id=current_user.id if current_user else None)
    return lead


@router.get("/{property_id}/whatsapp-link")
def get_whatsapp_link(
    property_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Devolve o link wa.me pronto, com mensagem pré-formatada sobre o imóvel."""
    db_prop = get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imóvel não encontrado.")

    contacto = db_prop.contacto_whatsapp or db_prop.contacto_telefone
    if not contacto:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este anúncio não tem contacto WhatsApp disponível.",
        )

    link = build_whatsapp_link(
        telefone=contacto,
        titulo_imovel=db_prop.titulo,
        preco=str(db_prop.preco),
        moeda=db_prop.moeda,
        provincia=db_prop.provincia,
        municipio=db_prop.municipio,
    )
    return {"link": link}
