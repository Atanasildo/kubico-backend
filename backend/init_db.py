"""Create all tables on startup (used instead of alembic on shared DBs)."""
from app.core.database import Base, engine
from app.models import user, property, favorite, payment, lead, report, verification, search_alert  # noqa: F401

Base.metadata.create_all(bind=engine)
print("Tables created/verified OK")
