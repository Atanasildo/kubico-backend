import uuid

from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("utilizador_id", "imovel_id", name="uq_favorite_user_property"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    utilizador_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    imovel_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    utilizador = relationship("User", back_populates="favoritos")
    imovel = relationship("Property", back_populates="favoritado_por")
