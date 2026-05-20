"""Add sequence column to recipe_tastings for dish reordering

Revision ID: b8c9d0e1f2g3
Revises: i1j2k3l4m5n6
Create Date: 2026-05-20

Adds nullable integer `sequence` column to recipe_tastings.
Existing rows default to NULL (insertion-order behaviour preserved
when no sequence numbers are set).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8c9d0e1f2g3'
down_revision: Union[str, Sequence[str], None] = 'i1j2k3l4m5n6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'recipe_tastings',
        sa.Column('sequence', sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('recipe_tastings', 'sequence')
