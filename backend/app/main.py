import logging as _startup_log

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.routes import (
    admin,
    alerts,
    auth,
    favorites,
    leads,
    payments,
    properties,
    reports,
    uploads,
    users,
    verification,
)
from app.core.config import settings
from app.core.database import Base, engine

# Cria tabelas se não existirem (desenvolvimento)
Base.metadata.create_all(bind=engine)

# ── Aviso de segurança em startup ────────────────────────────────────────────
_sec_logger = _startup_log.getLogger("kubico.security")
_INSECURE_DEFAULTS = {
    "SECRET_KEY": "troque-esta-chave-por-uma-chave-secreta-forte",
    "ADMIN_SETUP_KEY": "troque-esta-chave-admin-no-env",
}
for _var, _default in _INSECURE_DEFAULTS.items():
    if getattr(settings, _var, None) == _default:
        _sec_logger.warning(
            "SEGURANÇA: %s está com o valor padrão inseguro. "
            "Defina um valor forte no .env antes de ir a produção.",
            _var,
        )

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "API do KUBICO — Plataforma angolana de imóveis para arrendamento e venda. "
        "Conecta proprietários e inquilinos/compradores em angola com filtros por "
        "província, município e bairro, destaques pagos e verificação presencial."
    ),
    version="1.0.0",
)


# ── Middleware de segurança ──────────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")
        response.headers.setdefault(
            "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
        )
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.pop("Server", None)
        return response


app.add_middleware(SecurityHeadersMiddleware)

# ── CORS ─────────────────────────────────────────────────────────────────────
_allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── Servir uploads locais em dev ─────────────────────────────────────────────
_upload_dir = Path(settings.LOCAL_UPLOAD_DIR)
_upload_dir.mkdir(parents=True, exist_ok=True)
app.mount(
    settings.LOCAL_UPLOAD_PUBLIC_BASE,
    StaticFiles(directory=str(_upload_dir)),
    name="uploads",
)

# ── Routers ──────────────────────────────────────────────────────────────────
_prefix = settings.API_V1_PREFIX

app.include_router(auth.router, prefix=_prefix)
app.include_router(users.router, prefix=_prefix)
app.include_router(verification.router, prefix=_prefix)
app.include_router(properties.router, prefix=_prefix)
app.include_router(favorites.router, prefix=_prefix)
app.include_router(leads.router, prefix=_prefix)
app.include_router(alerts.router, prefix=_prefix)
app.include_router(reports.router, prefix=_prefix)
app.include_router(uploads.router, prefix=_prefix)
app.include_router(payments.router, prefix=_prefix)
app.include_router(admin.router, prefix=_prefix)


# ── Handlers ─────────────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    import logging
    logging.getLogger(__name__).error(
        "Erro 500: %s: %s", type(exc).__name__, str(exc), exc_info=exc
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno no servidor. Tente novamente mais tarde."},
    )


@app.get("/", tags=["Status"])
def root():
    return {"app": settings.PROJECT_NAME, "status": "online", "version": "1.0.0"}


@app.get("/health", tags=["Status"])
def health():
    return {"status": "ok"}


import logging as _logging
_logging.basicConfig(level=_logging.INFO)
_logging.getLogger(__name__).info("KUBICO API iniciada")
