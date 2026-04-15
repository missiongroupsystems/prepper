"""RLS helper: public.owns_recipe(p_recipe_id integer)

Returns true when the current user may WRITE to a recipe:
  - They own the recipe (owner_id = current user), OR
  - They are an admin.

Used in INSERT / UPDATE / DELETE policies for recipes and all
recipe sub-resources. Stricter than can_access_recipe — public
recipes are readable by everyone but only editable by their owner.

Usage:
    python -m scripts.helpers.owns_recipe
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import text
from sqlmodel import Session

from app.database import engine

SQL = """
CREATE OR REPLACE FUNCTION public.owns_recipe(p_recipe_id integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE id = p_recipe_id
              AND owner_id = auth.uid()::text
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
        print("OK  public.owns_recipe(integer)")


if __name__ == "__main__":
    main()
