"""Reestrutura características: contadores numéricos, utilities, acabamentos

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-03
"""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Converter campos booleanos antigos para inteiros onde faz sentido
    # (quartos e casas_banho já existem como Integer — só garantir NOT NULL com default)
    op.alter_column("properties", "quartos",
                    existing_type=sa.Integer(),
                    nullable=False,
                    server_default="0")
    op.alter_column("properties", "casas_banho",
                    existing_type=sa.Integer(),
                    nullable=False,
                    server_default="0")

    # Novos contadores
    op.add_column("properties", sa.Column("cozinhas",  sa.Integer(), nullable=False, server_default="0"))
    op.add_column("properties", sa.Column("salas",     sa.Integer(), nullable=False, server_default="0"))
    op.add_column("properties", sa.Column("varandas",  sa.Integer(), nullable=False, server_default="0"))
    op.add_column("properties", sa.Column("despensas", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("properties", sa.Column("garagens",  sa.Integer(), nullable=False, server_default="0"))

    # Remover booleanos que os contadores substituem
    op.drop_column("properties", "tem_cozinha")
    op.drop_column("properties", "tem_sala")
    op.drop_column("properties", "tem_varanda")
    op.drop_column("properties", "tem_garagem")

    # Utilities novas
    op.add_column("properties", sa.Column("tem_energia",       sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("properties", sa.Column("tem_agua",          sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("properties", sa.Column("tem_fossa_septica", sa.Boolean(), nullable=False, server_default="false"))

    # Acabamentos novos
    op.add_column("properties", sa.Column("piso_tipo", sa.String(20), nullable=False, server_default="outro"))

    # Garantir NOT NULL nos booleanos já existentes
    for col in ["mobilado", "tem_quintal", "tem_wc_servico",
                "tem_piscina", "tem_gerador", "tem_seguranca", "tem_elevador"]:
        op.alter_column("properties", col,
                        existing_type=sa.Boolean(),
                        nullable=False,
                        server_default="false")


def downgrade() -> None:
    for col in ["cozinhas", "salas", "varandas", "despensas", "garagens",
                "tem_energia", "tem_agua", "tem_fossa_septica", "piso_tipo"]:
        op.drop_column("properties", col)

    op.add_column("properties", sa.Column("tem_cozinha", sa.Boolean(), server_default="false"))
    op.add_column("properties", sa.Column("tem_sala",    sa.Boolean(), server_default="false"))
    op.add_column("properties", sa.Column("tem_varanda", sa.Boolean(), server_default="false"))
    op.add_column("properties", sa.Column("tem_garagem", sa.Boolean(), server_default="false"))
