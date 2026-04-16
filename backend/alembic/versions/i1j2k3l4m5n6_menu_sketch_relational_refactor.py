"""Menu sketch relational refactor — replace JSON sections/comments with proper tables.

Revision ID: i1j2k3l4m5n6
Revises: h1i2j3k4l5m6
Create Date: 2026-04-15

Changes
-------
menus_sketch:
  - Drop  ``sections``  (JSON)
  - Drop  ``comments``  (JSON)
  - Add   ``status``    VARCHAR  default 'draft'
  - Add   ``root``      INTEGER  nullable FK → menus_sketch.id

New tables:
  - menu_sketch_section
  - menu_sketch_section_item
  - menu_sketch_section_item_comments

RLS policies follow the same manager-or-admin write / authenticated-read
pattern used by the parent ``menus_sketch`` table.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'i1j2k3l4m5n6'
down_revision: Union[str, Sequence[str], None] = 'h1i2j3k4l5m6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _exec(sql: str) -> None:
    op.get_bind().execute(sa.text(sql))


def _enable_rls(table: str) -> None:
    _exec(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")


def _disable_rls(table: str) -> None:
    _exec(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")


def _drop_policies(table: str) -> None:
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(
            "SELECT policyname FROM pg_policies "
            "WHERE schemaname = 'public' AND tablename = :t"
        ),
        {"t": table},
    ).fetchall()
    for (name,) in rows:
        conn.execute(sa.text(f'DROP POLICY IF EXISTS "{name}" ON {table}'))


# ---------------------------------------------------------------------------
# upgrade
# ---------------------------------------------------------------------------

def upgrade() -> None:

    # ------------------------------------------------------------------
    # 1. Modify menus_sketch
    # ------------------------------------------------------------------

    # Drop legacy JSON columns (no data migration — treated as legacy)
    op.drop_column('menus_sketch', 'sections')
    op.drop_column('menus_sketch', 'comments')

    # Add status with a server default so existing rows are filled
    op.add_column(
        'menus_sketch',
        sa.Column(
            'status',
            sa.String(),
            nullable=False,
            server_default='draft',
        ),
    )
    # Remove server_default after backfill so new rows must be explicit
    op.alter_column('menus_sketch', 'status', server_default=None)

    # Add self-referencing root FK (nullable)
    op.add_column(
        'menus_sketch',
        sa.Column('root', sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        'fk_menus_sketch_root',
        'menus_sketch',
        'menus_sketch',
        ['root'],
        ['id'],
        ondelete='SET NULL',
    )

    # ------------------------------------------------------------------
    # 2. Create menu_sketch_section
    # ------------------------------------------------------------------

    op.create_table(
        'menu_sketch_section',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('menu_sketch_id', sa.Integer(), nullable=False),
        sa.Column('order_no', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(
            ['menu_sketch_id'],
            ['menus_sketch.id'],
            ondelete='CASCADE',
        ),
    )
    op.create_index(
        'ix_menu_sketch_section_menu_sketch_id',
        'menu_sketch_section',
        ['menu_sketch_id'],
    )

    # ------------------------------------------------------------------
    # 3. Create menu_sketch_section_item
    # ------------------------------------------------------------------

    op.create_table(
        'menu_sketch_section_item',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('menu_sketch_section_id', sa.Integer(), nullable=False),
        sa.Column('recipe_id', sa.Integer(), nullable=True),
        sa.Column('sales_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('cost_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('margin', sa.Numeric(10, 2), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_highlight', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('icons', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('order_no', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(
            ['menu_sketch_section_id'],
            ['menu_sketch_section.id'],
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['recipe_id'],
            ['recipes.id'],
            ondelete='SET NULL',
        ),
    )
    op.create_index(
        'ix_menu_sketch_section_item_section_id',
        'menu_sketch_section_item',
        ['menu_sketch_section_id'],
    )

    # ------------------------------------------------------------------
    # 4. Create menu_sketch_section_item_comments
    # ------------------------------------------------------------------

    op.create_table(
        'menu_sketch_section_item_comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('menu_sketch_section_item_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(
            ['menu_sketch_section_item_id'],
            ['menu_sketch_section_item.id'],
            ondelete='CASCADE',
        ),
    )
    op.create_index(
        'ix_menu_sketch_section_item_comments_item_id',
        'menu_sketch_section_item_comments',
        ['menu_sketch_section_item_id'],
    )

    # ------------------------------------------------------------------
    # 5. RLS for new tables
    # ------------------------------------------------------------------

    # menu_sketch_section
    _enable_rls('menu_sketch_section')
    _exec("""
        CREATE POLICY menu_sketch_section_select ON menu_sketch_section
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY menu_sketch_section_insert ON menu_sketch_section
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY menu_sketch_section_update ON menu_sketch_section
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY menu_sketch_section_delete ON menu_sketch_section
          FOR DELETE TO authenticated
          USING (public.is_manager_or_admin())
    """)

    # menu_sketch_section_item
    _enable_rls('menu_sketch_section_item')
    _exec("""
        CREATE POLICY menu_sketch_section_item_select ON menu_sketch_section_item
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY menu_sketch_section_item_insert ON menu_sketch_section_item
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY menu_sketch_section_item_update ON menu_sketch_section_item
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY menu_sketch_section_item_delete ON menu_sketch_section_item
          FOR DELETE TO authenticated
          USING (public.is_manager_or_admin())
    """)

    # menu_sketch_section_item_comments
    _enable_rls('menu_sketch_section_item_comments')
    _exec("""
        CREATE POLICY menu_sketch_section_item_comments_select ON menu_sketch_section_item_comments
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY menu_sketch_section_item_comments_insert ON menu_sketch_section_item_comments
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY menu_sketch_section_item_comments_update ON menu_sketch_section_item_comments
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY menu_sketch_section_item_comments_delete ON menu_sketch_section_item_comments
          FOR DELETE TO authenticated
          USING (public.is_manager_or_admin())
    """)


# ---------------------------------------------------------------------------
# downgrade
# ---------------------------------------------------------------------------

def downgrade() -> None:
    conn = op.get_bind()

    # Drop RLS from new tables (ignore if they don't exist)
    for table in [
        'menu_sketch_section_item_comments',
        'menu_sketch_section_item',
        'menu_sketch_section',
    ]:
        exists = conn.execute(
            sa.text("SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=:t"),
            {"t": table},
        ).scalar()
        if exists:
            _drop_policies(table)
            _disable_rls(table)

    # Drop new tables (reverse order due to FK dependencies)
    _exec('DROP TABLE IF EXISTS menu_sketch_section_item_comments CASCADE')
    _exec('DROP TABLE IF EXISTS menu_sketch_section_item CASCADE')
    _exec('DROP TABLE IF EXISTS menu_sketch_section CASCADE')

    # Revert menus_sketch changes (idempotent — only if columns still exist)
    has_root_fk = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_constraint WHERE conname = 'fk_menus_sketch_root'"
        )
    ).scalar()
    if has_root_fk:
        op.drop_constraint('fk_menus_sketch_root', 'menus_sketch', type_='foreignkey')

    menus_cols = {
        r[0]
        for r in conn.execute(
            sa.text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'menus_sketch'"
            )
        ).fetchall()
    }
    if 'root' in menus_cols:
        op.drop_column('menus_sketch', 'root')
    if 'status' in menus_cols:
        op.drop_column('menus_sketch', 'status')

    # Restore dropped columns (only if missing)
    if 'sections' not in menus_cols:
        op.add_column('menus_sketch', sa.Column('sections', sa.JSON(), nullable=True))
    if 'comments' not in menus_cols:
        op.add_column('menus_sketch', sa.Column('comments', sa.JSON(), nullable=True))
