"""Add sequence column to recipe_tastings for dish reordering

Revision ID: a7b8c9d0e1f2
Revises: z6a7b8c9d0e1
Create Date: 2026-05-20

- Add nullable integer `sequence` column to recipe_tastings
- Existing rows default to NULL (insertion-order behaviour preserved)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = 'z6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'recipe_tastings',
        sa.Column('sequence', sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('recipe_tastings', 'sequence')
