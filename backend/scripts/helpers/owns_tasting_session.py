"""RLS helper: public.owns_tasting_session(p_session_id integer)

Returns true when the current user may WRITE to a tasting session:
  - They created the session (creator_id = current user), OR
  - They are an admin.

Used in INSERT / UPDATE / DELETE policies for tasting_sessions,
tasting_users, recipe_tastings, and ingredient_tastings.
Stricter than can_access_tasting_session — participants can read
but cannot modify the session or its participant list.

Usage:
    python -m scripts.helpers.owns_tasting_session
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import text
from sqlmodel import Session

from app.database import engine

SQL = """
CREATE OR REPLACE FUNCTION public.owns_tasting_session(p_session_id integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (
        EXISTS (
            SELECT 1 FROM tasting_sessions
            WHERE id = p_session_id
              AND creator_id = auth.uid()::text
        )
        OR public.is_admin()
    )
$$
"""


def apply(session: Session) -> None:
    session.exec(text(SQL))


def main() -> None:
    with Session(engine) as session:
        apply(session)
        session.commit()
        print("OK  public.owns_tasting_session(integer)")


if __name__ == "__main__":
    main()
