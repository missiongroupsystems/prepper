"""Add source field to categories, outlets, and suppliers tables.

Revision ID: a0b1c2d3e4f5
Revises: g2h3i4j5k6l7
Create Date: 2026-03-17
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a0b1c2d3e4f5"
down_revision = "d5e6f7g8h9i0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for table in ("categories", "outlets", "suppliers"):
        op.add_column(
            table,
            sa.Column("source", sa.String(), nullable=False, server_default="manual"),
        )


def downgrade() -> None:
    for table in ("categories", "outlets", "suppliers"):
        op.drop_column(table, "source")
