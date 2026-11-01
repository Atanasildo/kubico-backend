"""initial schema — kubico

Revision ID: 0001
Revises:
Create Date: 2026-11-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nome", sa.String(150), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("telefone", sa.String(30), nullable=True, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("particular", "agente", "admin", name="userrole"),
            nullable=False,
            server_default="particular",
        ),
        sa.Column("provincia", sa.String(100), nullable=True),
        sa.Column("municipio", sa.String(100), nullable=True),
        sa.Column("foto_perfil_url", sa.String(500), nullable=True),
        sa.Column("bio", sa.String(500), nullable=True),
        sa.Column("nome_empresa", sa.String(150), nullable=True),
        sa.Column("email_verificado", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("telefone_verificado", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("plano_agente_expira_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("fcm_token", sa.String(512), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
    )

    # properties
    op.create_table(
        "properties",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("autor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("titulo", sa.String(150), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("tipo_negocio", sa.Enum("arrendamento", "venda", name="tiponegocio"), nullable=False),
        sa.Column("tipo_imovel", sa.Enum("apartamento", "casa", "terreno", "loja", "escritorio", "armazem", "quarto", "outro", name="tipoimovel"), nullable=False),
        sa.Column("preco", sa.Numeric(14, 2), nullable=False),
        sa.Column("moeda", sa.String(3), nullable=False, server_default="AOA"),
        sa.Column("provincia", sa.String(100), nullable=False, index=True),
        sa.Column("municipio", sa.String(100), nullable=False, index=True),
        sa.Column("bairro", sa.String(150), nullable=True, index=True),
        sa.Column("endereco_referencia", sa.String(300), nullable=True),
        sa.Column("latitude", sa.Numeric(10, 8), nullable=True),
        sa.Column("longitude", sa.Numeric(11, 8), nullable=True),
        sa.Column("area_m2", sa.Numeric(10, 2), nullable=True),
        sa.Column("quartos", sa.Integer(), nullable=True),
        sa.Column("casas_banho", sa.Integer(), nullable=True),
        sa.Column("mobilado", sa.Boolean(), nullable=True),
        sa.Column("tem_garagem", sa.Boolean(), server_default="false"),
        sa.Column("tem_quintal", sa.Boolean(), server_default="false"),
        sa.Column("andares", sa.Integer(), nullable=True),
        sa.Column("imagens", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("videos", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("contacto_telefone", sa.String(30), nullable=True),
        sa.Column("contacto_whatsapp", sa.String(30), nullable=True),
        sa.Column("status", sa.Enum("ativo", "arrendado", "vendido", "suspenso", name="propertystatus"), nullable=False, server_default="ativo"),
        sa.Column("verificado", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("aprovado", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("flagged", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("flag_reason", sa.String(500), nullable=True),
        sa.Column("destaque_ate", sa.DateTime(timezone=True), nullable=True),
        sa.Column("visualizacoes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
    )

    # favorites
    op.create_table(
        "favorites",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("utilizador_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("imovel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("utilizador_id", "imovel_id", name="uq_favorite_user_property"),
    )

    # leads
    op.create_table(
        "leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("imovel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("interessado_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("nome_interessado", sa.String(150), nullable=True),
        sa.Column("contacto_interessado", sa.String(50), nullable=True),
        sa.Column("canal", sa.Enum("whatsapp", "telefone", "chat_interno", name="leadcanal"), nullable=False),
        sa.Column("mensagem", sa.String(500), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # search_alerts
    op.create_table(
        "search_alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("utilizador_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tipo_negocio", sa.String(20), nullable=True),
        sa.Column("tipo_imovel", sa.String(20), nullable=True),
        sa.Column("provincia", sa.String(100), nullable=True),
        sa.Column("municipio", sa.String(100), nullable=True),
        sa.Column("bairro", sa.String(150), nullable=True),
        sa.Column("preco_max", sa.Numeric(14, 2), nullable=True),
        sa.Column("quartos_min", sa.Numeric(3, 0), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("ultima_notificacao_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # payments
    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("utilizador_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("imovel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("properties.id", ondelete="SET NULL"), nullable=True),
        sa.Column("tipo", sa.Enum("destaque", "plano_agente", "verificacao", name="paymenttipo"), nullable=False),
        sa.Column("valor", sa.Numeric(14, 2), nullable=False),
        sa.Column("status", sa.Enum("pendente", "pago", "falhado", "reembolsado", name="paymentstatus"), nullable=False, server_default="pendente"),
        sa.Column("entidade", sa.String(10), nullable=True),
        sa.Column("referencia", sa.String(20), nullable=True),
        sa.Column("validade", sa.DateTime(timezone=True), nullable=True),
        sa.Column("gateway_ref", sa.String(200), nullable=True),
        sa.Column("dias_destaque", sa.Numeric(4, 0), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("pago_em", sa.DateTime(timezone=True), nullable=True),
    )

    # property_reports
    op.create_table(
        "property_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("denunciante_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("imovel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("motivo", sa.Enum("anuncio_falso", "preco_enganoso", "ja_arrendado_vendido", "fotos_falsas", "comportamento_abusivo", "spam", "outro", name="reportreason"), nullable=False),
        sa.Column("descricao", sa.String(1000), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # verification_codes
    op.create_table(
        "verification_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("utilizador_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("canal", sa.Enum("email", "telefone", name="verificationchannel"), nullable=False),
        sa.Column("destino", sa.String(255), nullable=False),
        sa.Column("codigo_hash", sa.String(128), nullable=False),
        sa.Column("tentativas", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("usado", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expira_em", sa.DateTime(timezone=True), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("verification_codes")
    op.drop_table("property_reports")
    op.drop_table("payments")
    op.drop_table("search_alerts")
    op.drop_table("leads")
    op.drop_table("favorites")
    op.drop_table("properties")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS verificationchannel")
    op.execute("DROP TYPE IF EXISTS reportreason")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
    op.execute("DROP TYPE IF EXISTS paymenttipo")
    op.execute("DROP TYPE IF EXISTS leadcanal")
    op.execute("DROP TYPE IF EXISTS propertystatus")
    op.execute("DROP TYPE IF EXISTS tipoimovel")
    op.execute("DROP TYPE IF EXISTS tiponegocio")
    op.execute("DROP TYPE IF EXISTS userrole")
