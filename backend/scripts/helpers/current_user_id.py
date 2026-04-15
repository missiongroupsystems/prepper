"""RLS helper: public.current_user_id()

Returns the Supabase-authenticated user's ID as text.
Thin wrapper around auth.uid() so other helper functions
have a single place to resolve the current user identity.

Usage:
    python -m scripts.helpers.current_user_id
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import text
from sqlmodel import Session

from app.database import engine

SQL = """
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT auth.uid()::text
$$
"""


def apply(session: Session) -> None:
    session.exec(text(SQL))


def main() -> None:
    with Session(engine) as session:
        apply(session)
        session.commit()
        print("OK  public.current_user_id()")


if __name__ == "__main__":
    main()
