"""RLS helper: public.is_admin()

Returns true when the current Supabase-authenticated user has
user_type = 'admin' in the users table.

Used as a shorthand gate in all RLS policies that grant
unrestricted access to administrators.

Usage:
    python -m scripts.helpers.is_admin
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import text
from sqlmodel import Session

from app.database import engine

SQL = """
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()::text
          AND user_type = 'admin'
    )
$$
"""


def apply(session: Session) -> None:
    session.exec(text(SQL))


def main() -> None:
    with Session(engine) as session:
        apply(session)
        session.commit()
        print("OK  public.is_admin()")


if __name__ == "__main__":
    main()
