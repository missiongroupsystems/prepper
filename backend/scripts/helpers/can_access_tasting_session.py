"""RLS helper: public.can_access_tasting_session(p_session_id integer)

Returns true when the current user may READ a tasting session:
  - They created the session (creator_id = current user), OR
  - They are a listed participant (row in tasting_users), OR
  - They are an admin.

Mirrors the application-level _check_session_access() logic in
tasting_session_service.py so the same rules are enforced at the
database layer.

Used in SELECT policies for tasting_sessions, tasting_users,
tasting_notes, tasting_note_images, recipe_tastings, and
ingredient_tastings.

Usage:
    python -m scripts.helpers.can_access_tasting_session
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import text
from sqlmodel import Session

from app.database import engine

SQL = """
CREATE OR REPLACE FUNCTION public.can_access_tasting_session(p_session_id integer)
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
        OR EXISTS (
            SELECT 1 FROM tasting_users
            WHERE tasting_session_id = p_session_id
              AND user_id = auth.uid()::text
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
        print("OK  public.can_access_tasting_session(integer)")


if __name__ == "__main__":
    main()
