"""RLS helper: public.can_access_menu(p_menu_id integer)

Returns true when the current user may READ or WRITE a structured menu:
  - They created the menu (created_by = current user), OR
  - They are a manager or admin (is_manager = true OR user_type = 'admin').

Menus are manager-scoped resources — any manager can access any menu,
not just their own. Used in all policies for menus, menu_sections,
menu_items, and menu_outlets.

Usage:
    python -m scripts.helpers.can_access_menu
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import text
from sqlmodel import Session

from app.database import engine

SQL = """
CREATE OR REPLACE FUNCTION public.can_access_menu(p_menu_id integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (
        EXISTS (
            SELECT 1 FROM menus
            WHERE id = p_menu_id
              AND created_by = auth.uid()::text
        )
        OR public.is_manager_or_admin()
    )
$$
"""


def apply(session: Session) -> None:
    session.exec(text(SQL))


def main() -> None:
    with Session(engine) as session:
        apply(session)
        session.commit()
        print("OK  public.can_access_menu(integer)")


if __name__ == "__main__":
    main()
