"""Add supplier ingredient tags tables

Revision ID: a2b3c4d5e6f7
Revises: c5d6e7f8a9b0
Create Date: 2026-03-26

- Create supplier_ingredient_tags table
- Create supplier_ingredient_supplier_ingredient_tags join table
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, None] = 'c5d6e7f8a9b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'supplier_ingredient_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )

    op.create_table(
        'supplier_ingredient_supplier_ingredient_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('supplier_ingredient_id', sa.Integer(), nullable=False),
        sa.Column('supplier_ingredient_tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ['supplier_ingredient_id'],
            ['supplier_ingredients.id'],
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['supplier_ingredient_tag_id'],
            ['supplier_ingredient_tags.id'],
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'supplier_ingredient_id',
            'supplier_ingredient_tag_id',
            name='uq_si_tag_link',
        ),
    )
    op.create_index(
        'ix_si_tag_link_si_id',
        'supplier_ingredient_supplier_ingredient_tags',
        ['supplier_ingredient_id'],
    )
    op.create_index(
        'ix_si_tag_link_tag_id',
        'supplier_ingredient_supplier_ingredient_tags',
        ['supplier_ingredient_tag_id'],
    )


def downgrade() -> None:
    op.drop_index('ix_si_tag_link_tag_id', table_name='supplier_ingredient_supplier_ingredient_tags')
    op.drop_index('ix_si_tag_link_si_id', table_name='supplier_ingredient_supplier_ingredient_tags')
    op.drop_table('supplier_ingredient_supplier_ingredient_tags')
    op.drop_table('supplier_ingredient_tags')
