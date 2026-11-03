"""Add extended property feature fields

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-03
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("tem_cozinha", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("properties", sa.Column("tem_sala", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("properties", sa.Column("tem_varanda", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("properties", sa.Column("tem_wc_servico", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("properties", sa.Column("tem_piscina", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("properties", sa.Column("tem_gerador", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("properties", sa.Column("tem_seguranca", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("properties", sa.Column("tem_elevador", sa.Boolean(), nullable=True, server_default="false"))


def downgrade() -> None:
    for col in ["tem_cozinha", "tem_sala", "tem_varanda", "tem_wc_servico",
                "tem_piscina", "tem_gerador", "tem_seguranca", "tem_elevador"]:
        op.drop_column("properties", col)
