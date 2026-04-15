"""RLS helper: public.can_access_recipe(p_recipe_id integer)

Returns true when the current user may READ a recipe:
  - They own the recipe (owner_id = current user), OR
  - The recipe is public (is_public = true), OR
  - They are an admin.

Used in SELECT policies for recipes and all recipe sub-resources
(recipe_ingredients, recipe_images, recipe_recipes, etc.).

Usage:
    python -m scripts.helpers.can_access_recipe
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import text
from sqlmodel import Session

from app.database import engine

SQL = """
CREATE OR REPLACE FUNCTION public.can_access_recipe(p_recipe_id integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE id = p_recipe_id
              AND (owner_id = auth.uid()::text OR is_public = true)
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
        print("OK  public.can_access_recipe(integer)")


if __name__ == "__main__":
    main()
