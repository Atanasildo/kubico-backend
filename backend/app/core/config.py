from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "KUBICO API"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Banco de dados
    DATABASE_URL: str = "postgresql://kubico:kubico@db:5432/kubico"

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return "postgresql://" + value[len("postgres://"):]
        return value

    # JWT
    SECRET_KEY: str = "troque-esta-chave-por-uma-chave-secreta-forte"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    FRONTEND_URL: str = "https://kubico.vercel.app"

    # Admin
    ADMIN_SETUP_KEY: str = "troque-esta-chave-admin-no-env"

    @field_validator("ADMIN_SETUP_KEY")
    @classmethod
    def _validate_admin_key(cls, v: str) -> str:
        _insecure_default = "troque-esta-chave-admin-no-env"
        if v != _insecure_default and len(v) < 32:
            raise ValueError(
                "ADMIN_SETUP_KEY deve ter pelo menos 32 caracteres. "
                "Gera uma com: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        return v

    @field_validator("SECRET_KEY")
    @classmethod
    def _validate_secret_key(cls, v: str) -> str:
        _insecure_default = "troque-esta-chave-por-uma-chave-secreta-forte"
        if v != _insecure_default and len(v) < 32:
            raise ValueError(
                "SECRET_KEY deve ter pelo menos 32 caracteres. "
                "Gera uma com: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        return v

    # Verificacao OTP
    VERIFICATION_CODE_EXPIRE_MINUTES: int = 10
    VERIFICATION_CODE_MAX_ATTEMPTS: int = 5
    VERIFICATION_CODE_RESEND_SECONDS: int = 60

    # Email (SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@kubico.ao"

    # SMS
    SMS_API_KEY: str = "atsk_e619c6027d2823a87b5f1a8165bb77f2082acf288448bc1101af731ae842678294943f19"
    SMS_USERNAME: str = "sandbox"
    SMS_SENDER_ID: str = ""  # sandbox: deixar vazio (alphanumeric não está registado)

    # ── Supabase Storage (preferido — grátis, sem cartão) ─────────────────────
    # SUPABASE_URL        → https://<ref>.supabase.co
    # SUPABASE_SERVICE_KEY→ service_role JWT (Settings → API)
    # SUPABASE_BUCKET     → nome do bucket (ex: kubico-images)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_BUCKET: str = ""

    # ── S3 / MinIO fallback (opcional) ───────────────────────────────────────
    S3_BUCKET: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_REGION: str = "af-south-1"
    S3_ENDPOINT_URL: str = ""
    S3_PUBLIC_URL_BASE: str = ""

    # Limites de upload
    MAX_UPLOAD_SIZE_MB: int = 50
    MAX_VIDEO_SIZE_MB: int = 80

    # Upload local (fallback dev — perdido em cada restart do Render)
    LOCAL_UPLOAD_DIR: str = "/tmp/kubico_uploads"
    LOCAL_UPLOAD_PUBLIC_BASE: str = "/uploads"

    # Destaques pagos
    DESTAQUE_PRECO_7_DIAS: float = 1500.0
    DESTAQUE_PRECO_15_DIAS: float = 2500.0
    DESTAQUE_PRECO_30_DIAS: float = 4000.0

    # Plano agente
    PLANO_AGENTE_PRECO_MENSAL: float = 8000.0

    # Pagamentos (ProxyPay / Multicaixa Express)
    PROXYPAY_BASE_URL: str = "https://api.proxypay.co.ao"
    PROXYPAY_BEARER_TOKEN: str = ""
    PROXYPAY_POS_ID: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
