"""
Migration script for shared PostgreSQL database.
Adds Kubico-specific columns to the existing 'users' table (created by another app)
and creates all Kubico-specific tables from scratch.
Safe to run multiple times — uses IF NOT EXISTS throughout.
"""
import sys
from sqlalchemy import text
from app.core.database import engine, Base
from app.models import user, property, favorite, payment, lead, report, verification, search_alert  # noqa: F401


def run():
    with engine.begin() as conn:
        # 1. Create the userrole enum type if it doesn't exist
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
                    CREATE TYPE userrole AS ENUM ('particular', 'agente', 'admin');
                END IF;
            END
            $$;
        """))

        # 2. Add missing columns to the existing users table
        migrations = [
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
        for sql in migrations:
            try:
                conn.execute(text(sql))
            except Exception as e:
                print(f"  skipped: {sql[:60]}... ({e})", file=sys.stderr)

        # 3. Add unique indexes if they don't exist
        index_migrations = [
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)",
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_telefone ON users (telefone) WHERE telefone IS NOT NULL",
        ]
        for sql in index_migrations:
            try:
                conn.execute(text(sql))
            except Exception as e:
                print(f"  skipped index: {e}", file=sys.stderr)

    # 4. Create all other Kubico tables (properties, favorites, etc.) — skips existing ones
    Base.metadata.create_all(bind=engine)
    print("Kubico migration complete.")


if __name__ == "__main__":
    run()
