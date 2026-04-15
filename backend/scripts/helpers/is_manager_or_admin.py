"""RLS helper: public.is_manager_or_admin()

Returns true when the current user is either an admin
(user_type = 'admin') or has the manager flag set (is_manager = true).

Used to gate write access to shared reference data such as ingredients,
suppliers, categories, and menu sketches.

Usage:
    python -m scripts.helpers.is_manager_or_admin
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import text
from sqlmodel import Session

from app.database import engine

SQL = """
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()::text
          AND (user_type = 'admin' OR is_manager = true)
    )
$$
"""


def apply(session: Session) -> None:
    session.exec(text(SQL))


def main() -> None:
    with Session(engine) as session:
        apply(session)
        session.commit()
        print("OK  public.is_manager_or_admin()")


if __name__ == "__main__":
    main()
