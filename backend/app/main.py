import logging as _startup_log

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

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

# create_all é seguro para tabelas que ainda não existem (não destrói dados).
# Necessário para criar refresh_tokens em produção sem migração manual.
# Quando tiveres acesso ao shell do Render e correres `alembic upgrade head`,
# podes voltar a condicionar isto a ENVIRONMENT == "development".
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

# ── Rate limiter (slowapi) ────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "API do KUBICO — Plataforma angolana de imóveis para arrendamento e venda."
    ),
    version="1.0.0",
    # Esconder versão e detalhes em produção
    openapi_url="/api/openapi.json" if settings.ENVIRONMENT == "development" else None,
    docs_url="/api/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Exportar limiter para uso nos routers
app.state.limiter = limiter


# ── Middleware: body size máximo ──────────────────────────────────────────────
class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    """Rejeita requests JSON maiores que 2MB — previne DoS por body flooding."""
    MAX_BYTES = 2 * 1024 * 1024  # 2MB (uploads têm o seu próprio limite via storage.py)

    async def dispatch(self, request: Request, call_next):
        # Não aplicar a uploads de ficheiros (multipart tem o seu próprio limite)
        content_type = request.headers.get("content-type", "")
        if "multipart" in content_type:
            return await call_next(request)
        cl = request.headers.get("content-length")
        if cl and int(cl) > self.MAX_BYTES:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request demasiado grande. Máximo: 2MB para JSON."},
            )
        return await call_next(request)


# ── Middleware: security headers ──────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Prevenir clickjacking
        response.headers.setdefault("X-Frame-Options", "DENY")
        # Prevenir MIME sniffing
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        # HSTS — forçar HTTPS em produção
        response.headers.setdefault(
            "Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload"
        )
        # Política de referrer
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        # Content Security Policy — principal defesa contra XSS
        response.headers.setdefault(
            "Content-Security-Policy",
            (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: blob: https://*.supabase.co; "
                "media-src 'self' https://*.supabase.co; "
                "connect-src 'self' https://*.supabase.co; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            ),
        )
        # Desabilitar APIs do browser desnecessárias
        response.headers.setdefault(
            "Permissions-Policy",
            "geolocation=(), camera=(), microphone=(), payment=()",
        )
        # Remover headers que revelam tecnologia
        for _h in ("server", "x-powered-by"):
            try:
                del response.headers[_h]
            except KeyError:
                pass
        # X-XSS-Protection obsoleto em browsers modernos — omitir
        return response


app.add_middleware(MaxBodySizeMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# ── CORS ──────────────────────────────────────────────────────────────────────
_allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── Servir uploads locais em dev ──────────────────────────────────────────────
_upload_dir = Path(settings.LOCAL_UPLOAD_DIR)
_upload_dir.mkdir(parents=True, exist_ok=True)
app.mount(
    settings.LOCAL_UPLOAD_PUBLIC_BASE,
    StaticFiles(directory=str(_upload_dir)),
    name="uploads",
)

# ── Routers ───────────────────────────────────────────────────────────────────
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


# ── Handlers ──────────────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    import logging
    logging.getLogger(__name__).error(
        "Erro 500: %s: %s", type(exc).__name__, str(exc), exc_info=exc
    )
    # Nunca expor detalhes internos em produção
    detail = (
        f"{type(exc).__name__}: {exc}"
        if settings.ENVIRONMENT == "development"
        else "Erro interno no servidor. Tente novamente mais tarde."
    )
    return JSONResponse(status_code=500, content={"detail": detail})


@app.get("/", tags=["Status"])
def root():
    # Não expor versão em produção
    return {"app": settings.PROJECT_NAME, "status": "online"}


@app.get("/health", tags=["Status"])
def health():
    return {"status": "ok"}


import logging as _logging
_logging.basicConfig(level=_logging.INFO)
_logging.getLogger(__name__).info("KUBICO API iniciada")
