"""
Migration script for shared PostgreSQL database.
Safe to run multiple times — uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout.
"""
import sys
from sqlalchemy import text
from app.core.database import engine, Base
from app.models import user, property, favorite, payment, lead, report, verification, search_alert, password_reset  # noqa: F401


def run():
    with engine.begin() as conn:

        # ── 1. Enums ──────────────────────────────────────────────────────────
        conn.execute(text("""
            DO $$
            BEGIN
                -- userrole
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
                    CREATE TYPE userrole AS ENUM ('particular', 'agente', 'admin');
                ELSE
                    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'userrole' AND e.enumlabel = 'particular') THEN
                        ALTER TYPE userrole ADD VALUE 'particular';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'userrole' AND e.enumlabel = 'agente') THEN
                        ALTER TYPE userrole ADD VALUE 'agente';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'userrole' AND e.enumlabel = 'admin') THEN
                        ALTER TYPE userrole ADD VALUE 'admin';
                    END IF;
                END IF;

                -- paymenttipo
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymenttipo') THEN
                    CREATE TYPE paymenttipo AS ENUM ('destaque', 'plano_agente', 'verificacao');
                ELSE
                    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'paymenttipo' AND e.enumlabel = 'destaque') THEN
                        ALTER TYPE paymenttipo ADD VALUE 'destaque';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'paymenttipo' AND e.enumlabel = 'plano_agente') THEN
                        ALTER TYPE paymenttipo ADD VALUE 'plano_agente';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'paymenttipo' AND e.enumlabel = 'verificacao') THEN
                        ALTER TYPE paymenttipo ADD VALUE 'verificacao';
                    END IF;
                END IF;

                -- paymentstatus
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentstatus') THEN
                    CREATE TYPE paymentstatus AS ENUM ('pendente', 'pago', 'falhado', 'reembolsado');
                ELSE
                    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'paymentstatus' AND e.enumlabel = 'pendente') THEN
                        ALTER TYPE paymentstatus ADD VALUE 'pendente';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'paymentstatus' AND e.enumlabel = 'pago') THEN
                        ALTER TYPE paymentstatus ADD VALUE 'pago';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'paymentstatus' AND e.enumlabel = 'falhado') THEN
                        ALTER TYPE paymentstatus ADD VALUE 'falhado';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'paymentstatus' AND e.enumlabel = 'reembolsado') THEN
                        ALTER TYPE paymentstatus ADD VALUE 'reembolsado';
                    END IF;
                END IF;
            END
            $$;
        """))

        # ── 2. users table ────────────────────────────────────────────────────
        user_migrations = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS nome VARCHAR(150)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone VARCHAR(30)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role userrole DEFAULT 'particular'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS provincia VARCHAR(100)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS municipio VARCHAR(100)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_perfil_url VARCHAR(500)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(500)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS nome_empresa VARCHAR(150)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone_verificado BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS plano_agente_expira_em TIMESTAMPTZ",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE NOT NULL",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token VARCHAR(512)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT NOW()",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ",
        ]
        for sql in user_migrations:
            try:
                conn.execute(text(sql))
            except Exception as e:
                print(f"  skipped users: {sql[:60]}... ({e})", file=sys.stderr)

        # ── 3. Unique indexes on users ────────────────────────────────────────
        for sql in [
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)",
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_telefone ON users (telefone) WHERE telefone IS NOT NULL",
        ]:
            try:
                conn.execute(text(sql))
            except Exception as e:
                print(f"  skipped index: {e}", file=sys.stderr)

        # ── 4. payments table — patch missing columns if table already exists ─
        payment_migrations = [
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS entidade VARCHAR(10)",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS referencia VARCHAR(20)",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS validade TIMESTAMPTZ",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_ref VARCHAR(200)",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS dias_destaque NUMERIC(4,0)",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS pago_em TIMESTAMPTZ",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS imovel_id UUID",
        ]
        for sql in payment_migrations:
            try:
                conn.execute(text(sql))
            except Exception as e:
                print(f"  skipped payments: {sql[:60]}... ({e})", file=sys.stderr)

        # ── 5. properties table ───────────────────────────────────────────────
        property_migrations = [
            # base
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS bairro VARCHAR(150)",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS endereco_referencia VARCHAR(300)",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8)",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8)",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS area_m2 NUMERIC(10,2)",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS quartos INTEGER DEFAULT 0",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS casas_banho INTEGER DEFAULT 0",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS andares INTEGER",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS videos TEXT[]",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS contacto_telefone VARCHAR(30)",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS contacto_whatsapp VARCHAR(30)",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS aparece_no_feed BOOLEAN NOT NULL DEFAULT TRUE",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS aprovado BOOLEAN DEFAULT TRUE NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS flag_reason VARCHAR(500)",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS destaque_ate TIMESTAMPTZ",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS visualizacoes INTEGER DEFAULT 0 NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ",
            # contadores v2
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS cozinhas INTEGER DEFAULT 0 NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS salas INTEGER DEFAULT 0 NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS varandas INTEGER DEFAULT 0 NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS despensas INTEGER DEFAULT 0 NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS garagens INTEGER DEFAULT 0 NOT NULL",
            # utilities
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS tem_energia BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS tem_agua BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS tem_gerador BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS tem_fossa_septica BOOLEAN DEFAULT FALSE NOT NULL",
            # acabamentos
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS piso_tipo VARCHAR(20) DEFAULT 'outro' NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS mobilado BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS tem_piscina BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS tem_seguranca BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS tem_elevador BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS tem_quintal BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS tem_wc_servico BOOLEAN DEFAULT FALSE NOT NULL",
        ]
        for sql in property_migrations:
            try:
                conn.execute(text(sql))
            except Exception as e:
                print(f"  skipped properties: {sql[:60]}... ({e})", file=sys.stderr)

    # ── 6. password_reset_tokens table ───────────────────────────────────────
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash VARCHAR(64) UNIQUE NOT NULL,
                usado BOOLEAN NOT NULL DEFAULT FALSE,
                expira_em TIMESTAMPTZ NOT NULL,
                criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id)
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash)
        """))

    # ── 7. Create all tables that don't exist yet (skips existing ones) ───────
    Base.metadata.create_all(bind=engine)
    print("Kubico migration complete.")


if __name__ == "__main__":
    run()
