import uuid

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, _DUMMY_HASH
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_phone(db: Session, telefone: str) -> User | None:
    return db.query(User).filter(User.telefone == telefone).first()


def create_user(db: Session, user_in: UserCreate) -> User:
    db_user = User(
        nome=user_in.nome,
        email=user_in.email,
        telefone=user_in.telefone,
        role=user_in.role,
        provincia=user_in.provincia,
        municipio=user_in.municipio,
        nome_empresa=user_in.nome_empresa,
        hashed_password=hash_password(user_in.senha),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, senha: str) -> User | None:
    """Autenticação com timing constante — impede enumeração de emails por timing attack."""
    user = get_user_by_email(db, email)
    # Sempre correr o verify mesmo quando o utilizador não existe,
    # para que o tempo de resposta seja idêntico em ambos os casos.
    candidate_hash = user.hashed_password if user else _DUMMY_HASH
    valid = verify_password(senha, candidate_hash)
    if not user or not valid:
        return None
    return user


def update_user(db: Session, db_user: User, user_in: UserUpdate) -> User:
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
