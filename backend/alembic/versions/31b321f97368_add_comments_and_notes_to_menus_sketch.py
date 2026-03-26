"""add_comments_and_notes_to_menus_sketch

Revision ID: 31b321f97368
Revises: a2b3c4d5e6f7
Create Date: 2026-03-26 16:34:35.742433

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = '31b321f97368'
down_revision: Union[str, None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('menus_sketch', sa.Column('comments', sa.JSON(), nullable=True))
    op.add_column('menus_sketch', sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    op.drop_column('menus_sketch', 'notes')
    op.drop_column('menus_sketch', 'comments')
