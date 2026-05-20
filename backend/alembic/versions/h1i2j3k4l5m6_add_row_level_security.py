"""Add row-level security (RLS) policies to all tables.

Revision ID: h1i2j3k4l5m6
Revises: 2682e67b2782, 31b321f97368, b3c4d5e6f7g8
Create Date: 2026-04-15

Merges the three open heads and enables PostgreSQL RLS on every table.

Permission model
----------------
- admin (user_type='admin')       : full access to all tables
- manager (is_manager=True)       : read/write shared reference data
                                    (ingredients, suppliers, categories),
                                    manage menus and menu sketches
- normal (authenticated user)     : own recipes, sessions they created or
                                    participate in, own tasting notes
- unauthenticated / anon role     : no access (no policies created for it)

Implementation notes
--------------------
- Requires Supabase Postgres: policies rely on auth.uid() from the
  Supabase auth schema to resolve the current user's ID.
- The FastAPI backend connects via the Postgres service role (superuser),
  which carries BYPASSRLS by default in Supabase, so backend queries are
  unaffected by these policies.  RLS applies to direct Supabase client
  connections using the `authenticated` role.
- FORCE ROW LEVEL SECURITY is NOT set, so the table-owning role is still
  exempt (safe for local dev with SQLite-style setups).

Helper functions created in the public schema
---------------------------------------------
  current_user_id()                    -> text
  is_admin()                           -> bool
  is_manager_or_admin()                -> bool
  can_access_recipe(int)               -> bool  (owner or is_public or admin)
  owns_recipe(int)                     -> bool  (owner or admin)
  can_access_tasting_session(int)      -> bool  (creator or participant or admin)
  owns_tasting_session(int)            -> bool  (creator or admin)
  can_access_menu(int)                 -> bool  (creator or manager/admin)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'h1i2j3k4l5m6'
down_revision: Union[str, Sequence[str], None] = (
    '2682e67b2782',
    '31b321f97368',
    'b3c4d5e6f7g8',
)
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
    """Drop all policies on *table* dynamically (safe for downgrade)."""
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

    # -----------------------------------------------------------------------
    # Helper functions
    # -----------------------------------------------------------------------

    _exec("""
        CREATE OR REPLACE FUNCTION public.current_user_id()
        RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
            SELECT auth.uid()::text
        $$
    """)

    _exec("""
        CREATE OR REPLACE FUNCTION public.is_admin()
        RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
            SELECT EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()::text
                  AND LOWER(user_type::text) = 'admin'
            )
        $$
    """)

    _exec("""
        CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
        RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
            SELECT EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()::text
                  AND (LOWER(user_type::text) = 'admin' OR is_manager = true)
            )
        $$
    """)

    _exec("""
        CREATE OR REPLACE FUNCTION public.can_access_recipe(p_recipe_id integer)
        RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
            SELECT (
                EXISTS (
                    SELECT 1 FROM recipes
                    WHERE id = p_recipe_id
                      AND (owner_id = auth.uid()::text OR is_public = true)
                )
                OR public.is_admin()
            )
        $$
    """)

    _exec("""
        CREATE OR REPLACE FUNCTION public.owns_recipe(p_recipe_id integer)
        RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
            SELECT (
                EXISTS (
                    SELECT 1 FROM recipes
                    WHERE id = p_recipe_id
                      AND owner_id = auth.uid()::text
                )
                OR public.is_admin()
            )
        $$
    """)

    _exec("""
        CREATE OR REPLACE FUNCTION public.can_access_tasting_session(p_session_id integer)
        RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
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
    """)

    _exec("""
        CREATE OR REPLACE FUNCTION public.owns_tasting_session(p_session_id integer)
        RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
            SELECT (
                EXISTS (
                    SELECT 1 FROM tasting_sessions
                    WHERE id = p_session_id
                      AND creator_id = auth.uid()::text
                )
                OR public.is_admin()
            )
        $$
    """)

    _exec("""
        CREATE OR REPLACE FUNCTION public.can_access_menu(p_menu_id integer)
        RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
            SELECT (
                EXISTS (
                    SELECT 1 FROM menus
                    WHERE id = p_menu_id
                      AND created_by = auth.uid()::text
                )
                OR public.is_manager_or_admin()
            )
        $$
    """)

    # -----------------------------------------------------------------------
    # users
    # -----------------------------------------------------------------------

    _enable_rls('users')

    # Own row visible to self; admins see all
    _exec("""
        CREATE POLICY users_select ON users
          FOR SELECT TO authenticated
          USING (id = auth.uid()::text OR public.is_admin())
    """)
    # Self-service update (e.g. phone number); admins can update anyone
    _exec("""
        CREATE POLICY users_update ON users
          FOR UPDATE TO authenticated
          USING (id = auth.uid()::text OR public.is_admin())
          WITH CHECK (id = auth.uid()::text OR public.is_admin())
    """)
    # Only admins can delete users
    _exec("""
        CREATE POLICY users_delete ON users
          FOR DELETE TO authenticated
          USING (public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # recipes
    # -----------------------------------------------------------------------

    _enable_rls('recipes')

    _exec("""
        CREATE POLICY recipes_select ON recipes
          FOR SELECT TO authenticated
          USING (owner_id = auth.uid()::text OR is_public = true OR public.is_admin())
    """)
    _exec("""
        CREATE POLICY recipes_insert ON recipes
          FOR INSERT TO authenticated
          WITH CHECK (owner_id = auth.uid()::text OR public.is_admin())
    """)
    _exec("""
        CREATE POLICY recipes_update ON recipes
          FOR UPDATE TO authenticated
          USING (owner_id = auth.uid()::text OR public.is_admin())
          WITH CHECK (owner_id = auth.uid()::text OR public.is_admin())
    """)
    _exec("""
        CREATE POLICY recipes_delete ON recipes
          FOR DELETE TO authenticated
          USING (owner_id = auth.uid()::text OR public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # recipe_ingredients
    # -----------------------------------------------------------------------

    _enable_rls('recipe_ingredients')

    _exec("""
        CREATE POLICY recipe_ingredients_select ON recipe_ingredients
          FOR SELECT TO authenticated
          USING (public.can_access_recipe(recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_ingredients_insert ON recipe_ingredients
          FOR INSERT TO authenticated
          WITH CHECK (public.owns_recipe(recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_ingredients_update ON recipe_ingredients
          FOR UPDATE TO authenticated
          USING (public.owns_recipe(recipe_id))
          WITH CHECK (public.owns_recipe(recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_ingredients_delete ON recipe_ingredients
          FOR DELETE TO authenticated
          USING (public.owns_recipe(recipe_id))
    """)

    # -----------------------------------------------------------------------
    # recipe_images
    # -----------------------------------------------------------------------

    _enable_rls('recipe_images')

    _exec("""
        CREATE POLICY recipe_images_select ON recipe_images
          FOR SELECT TO authenticated
          USING (public.can_access_recipe(recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_images_insert ON recipe_images
          FOR INSERT TO authenticated
          WITH CHECK (public.owns_recipe(recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_images_update ON recipe_images
          FOR UPDATE TO authenticated
          USING (public.owns_recipe(recipe_id))
          WITH CHECK (public.owns_recipe(recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_images_delete ON recipe_images
          FOR DELETE TO authenticated
          USING (public.owns_recipe(recipe_id))
    """)

    # -----------------------------------------------------------------------
    # recipe_recipes  (sub-recipe / BOM hierarchy)
    # -----------------------------------------------------------------------

    _enable_rls('recipe_recipes')

    _exec("""
        CREATE POLICY recipe_recipes_select ON recipe_recipes
          FOR SELECT TO authenticated
          USING (public.can_access_recipe(parent_recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_recipes_insert ON recipe_recipes
          FOR INSERT TO authenticated
          WITH CHECK (public.owns_recipe(parent_recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_recipes_update ON recipe_recipes
          FOR UPDATE TO authenticated
          USING (public.owns_recipe(parent_recipe_id))
          WITH CHECK (public.owns_recipe(parent_recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_recipes_delete ON recipe_recipes
          FOR DELETE TO authenticated
          USING (public.owns_recipe(parent_recipe_id))
    """)

    # -----------------------------------------------------------------------
    # recipe_recipe_categories
    # -----------------------------------------------------------------------

    _enable_rls('recipe_recipe_categories')

    _exec("""
        CREATE POLICY recipe_recipe_categories_select ON recipe_recipe_categories
          FOR SELECT TO authenticated
          USING (public.can_access_recipe(recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_recipe_categories_insert ON recipe_recipe_categories
          FOR INSERT TO authenticated
          WITH CHECK (public.owns_recipe(recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_recipe_categories_update ON recipe_recipe_categories
          FOR UPDATE TO authenticated
          USING (public.owns_recipe(recipe_id))
          WITH CHECK (public.owns_recipe(recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_recipe_categories_delete ON recipe_recipe_categories
          FOR DELETE TO authenticated
          USING (public.owns_recipe(recipe_id))
    """)

    # -----------------------------------------------------------------------
    # recipe_outlets  (recipe–outlet assignment with price overrides)
    # -----------------------------------------------------------------------

    _enable_rls('recipe_outlets')

    _exec("""
        CREATE POLICY recipe_outlets_select ON recipe_outlets
          FOR SELECT TO authenticated
          USING (public.can_access_recipe(recipe_id))
    """)
    # Only the recipe owner or an admin can assign recipes to outlets
    _exec("""
        CREATE POLICY recipe_outlets_insert ON recipe_outlets
          FOR INSERT TO authenticated
          WITH CHECK (public.owns_recipe(recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_outlets_update ON recipe_outlets
          FOR UPDATE TO authenticated
          USING (public.owns_recipe(recipe_id))
          WITH CHECK (public.owns_recipe(recipe_id))
    """)
    _exec("""
        CREATE POLICY recipe_outlets_delete ON recipe_outlets
          FOR DELETE TO authenticated
          USING (public.owns_recipe(recipe_id))
    """)

    # -----------------------------------------------------------------------
    # ingredients  (global shared reference data)
    # -----------------------------------------------------------------------

    _enable_rls('ingredients')

    _exec("""
        CREATE POLICY ingredients_select ON ingredients
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY ingredients_insert ON ingredients
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY ingredients_update ON ingredients
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY ingredients_delete ON ingredients
          FOR DELETE TO authenticated
          USING (public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # categories  (ingredient food categories)
    # -----------------------------------------------------------------------

    _enable_rls('categories')

    _exec("""
        CREATE POLICY categories_select ON categories
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY categories_insert ON categories
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY categories_update ON categories
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY categories_delete ON categories
          FOR DELETE TO authenticated
          USING (public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # allergens
    # -----------------------------------------------------------------------

    _enable_rls('allergens')

    _exec("""
        CREATE POLICY allergens_select ON allergens
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY allergens_insert ON allergens
          FOR INSERT TO authenticated
          WITH CHECK (public.is_admin())
    """)
    _exec("""
        CREATE POLICY allergens_update ON allergens
          FOR UPDATE TO authenticated
          USING (public.is_admin())
          WITH CHECK (public.is_admin())
    """)
    _exec("""
        CREATE POLICY allergens_delete ON allergens
          FOR DELETE TO authenticated
          USING (public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # ingredient_allergens  (join table)
    # -----------------------------------------------------------------------

    _enable_rls('ingredient_allergens')

    _exec("""
        CREATE POLICY ingredient_allergens_select ON ingredient_allergens
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY ingredient_allergens_insert ON ingredient_allergens
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY ingredient_allergens_update ON ingredient_allergens
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY ingredient_allergens_delete ON ingredient_allergens
          FOR DELETE TO authenticated
          USING (public.is_manager_or_admin())
    """)

    # -----------------------------------------------------------------------
    # recipe_categories  (recipe classification labels — global)
    # -----------------------------------------------------------------------

    _enable_rls('recipe_categories')

    _exec("""
        CREATE POLICY recipe_categories_select ON recipe_categories
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY recipe_categories_insert ON recipe_categories
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY recipe_categories_update ON recipe_categories
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY recipe_categories_delete ON recipe_categories
          FOR DELETE TO authenticated
          USING (public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # suppliers
    # -----------------------------------------------------------------------

    _enable_rls('suppliers')

    _exec("""
        CREATE POLICY suppliers_select ON suppliers
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY suppliers_insert ON suppliers
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY suppliers_update ON suppliers
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY suppliers_delete ON suppliers
          FOR DELETE TO authenticated
          USING (public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # supplier_ingredients  (pricing per supplier per outlet)
    # -----------------------------------------------------------------------

    _enable_rls('supplier_ingredients')

    _exec("""
        CREATE POLICY supplier_ingredients_select ON supplier_ingredients
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY supplier_ingredients_insert ON supplier_ingredients
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY supplier_ingredients_update ON supplier_ingredients
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY supplier_ingredients_delete ON supplier_ingredients
          FOR DELETE TO authenticated
          USING (public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # outlet_supplier_ingredient  (outlet-scoped pricing overrides)
    # -----------------------------------------------------------------------

    _enable_rls('outlet_supplier_ingredient')

    _exec("""
        CREATE POLICY outlet_supplier_ingredient_select ON outlet_supplier_ingredient
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY outlet_supplier_ingredient_insert ON outlet_supplier_ingredient
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY outlet_supplier_ingredient_update ON outlet_supplier_ingredient
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY outlet_supplier_ingredient_delete ON outlet_supplier_ingredient
          FOR DELETE TO authenticated
          USING (public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # supplier_ingredient_tags
    # -----------------------------------------------------------------------

    _enable_rls('supplier_ingredient_tags')

    _exec("""
        CREATE POLICY supplier_ingredient_tags_select ON supplier_ingredient_tags
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY supplier_ingredient_tags_insert ON supplier_ingredient_tags
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY supplier_ingredient_tags_update ON supplier_ingredient_tags
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY supplier_ingredient_tags_delete ON supplier_ingredient_tags
          FOR DELETE TO authenticated
          USING (public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # supplier_ingredient_supplier_ingredient_tags  (tag join table)
    # -----------------------------------------------------------------------

    _enable_rls('supplier_ingredient_supplier_ingredient_tags')

    _exec("""
        CREATE POLICY sit_join_select ON supplier_ingredient_supplier_ingredient_tags
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY sit_join_insert ON supplier_ingredient_supplier_ingredient_tags
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY sit_join_update ON supplier_ingredient_supplier_ingredient_tags
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY sit_join_delete ON supplier_ingredient_supplier_ingredient_tags
          FOR DELETE TO authenticated
          USING (public.is_manager_or_admin())
    """)

    # -----------------------------------------------------------------------
    # outlets  (brands / locations — admin-managed global reference)
    # -----------------------------------------------------------------------

    _enable_rls('outlets')

    _exec("""
        CREATE POLICY outlets_select ON outlets
          FOR SELECT TO authenticated
          USING (true)
    """)
    _exec("""
        CREATE POLICY outlets_insert ON outlets
          FOR INSERT TO authenticated
          WITH CHECK (public.is_admin())
    """)
    _exec("""
        CREATE POLICY outlets_update ON outlets
          FOR UPDATE TO authenticated
          USING (public.is_admin())
          WITH CHECK (public.is_admin())
    """)
    _exec("""
        CREATE POLICY outlets_delete ON outlets
          FOR DELETE TO authenticated
          USING (public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # tasting_sessions
    # -----------------------------------------------------------------------

    _enable_rls('tasting_sessions')

    # Visible to creator, all participants, and admins
    _exec("""
        CREATE POLICY tasting_sessions_select ON tasting_sessions
          FOR SELECT TO authenticated
          USING (public.can_access_tasting_session(id))
    """)
    _exec("""
        CREATE POLICY tasting_sessions_insert ON tasting_sessions
          FOR INSERT TO authenticated
          WITH CHECK (creator_id = auth.uid()::text OR public.is_admin())
    """)
    # Only the creator or an admin can edit/delete the session itself
    _exec("""
        CREATE POLICY tasting_sessions_update ON tasting_sessions
          FOR UPDATE TO authenticated
          USING (public.owns_tasting_session(id))
          WITH CHECK (public.owns_tasting_session(id))
    """)
    _exec("""
        CREATE POLICY tasting_sessions_delete ON tasting_sessions
          FOR DELETE TO authenticated
          USING (public.owns_tasting_session(id))
    """)

    # -----------------------------------------------------------------------
    # tasting_users  (participant join table)
    # -----------------------------------------------------------------------

    _enable_rls('tasting_users')

    _exec("""
        CREATE POLICY tasting_users_select ON tasting_users
          FOR SELECT TO authenticated
          USING (public.can_access_tasting_session(tasting_session_id))
    """)
    # Only the session creator or admin can add/remove participants
    _exec("""
        CREATE POLICY tasting_users_insert ON tasting_users
          FOR INSERT TO authenticated
          WITH CHECK (public.owns_tasting_session(tasting_session_id))
    """)
    _exec("""
        CREATE POLICY tasting_users_delete ON tasting_users
          FOR DELETE TO authenticated
          USING (public.owns_tasting_session(tasting_session_id))
    """)

    # -----------------------------------------------------------------------
    # tasting_notes
    # -----------------------------------------------------------------------

    _enable_rls('tasting_notes')

    # Any session participant can read notes
    _exec("""
        CREATE POLICY tasting_notes_select ON tasting_notes
          FOR SELECT TO authenticated
          USING (public.can_access_tasting_session(session_id))
    """)
    # Any participant can leave a note
    _exec("""
        CREATE POLICY tasting_notes_insert ON tasting_notes
          FOR INSERT TO authenticated
          WITH CHECK (
              public.can_access_tasting_session(session_id)
              AND (user_id = auth.uid()::text OR public.is_admin())
          )
    """)
    # Only the note author or admin can edit/delete
    _exec("""
        CREATE POLICY tasting_notes_update ON tasting_notes
          FOR UPDATE TO authenticated
          USING (user_id = auth.uid()::text OR public.is_admin())
          WITH CHECK (user_id = auth.uid()::text OR public.is_admin())
    """)
    _exec("""
        CREATE POLICY tasting_notes_delete ON tasting_notes
          FOR DELETE TO authenticated
          USING (user_id = auth.uid()::text OR public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # tasting_note_images
    # Each row links to EITHER a tasting_note OR an ingredient_tasting_note.
    # -----------------------------------------------------------------------

    _enable_rls('tasting_note_images')

    _exec("""
        CREATE POLICY tasting_note_images_select ON tasting_note_images
          FOR SELECT TO authenticated
          USING (
            (
              tasting_note_id IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM tasting_notes tn
                WHERE tn.id = tasting_note_id
                  AND public.can_access_tasting_session(tn.session_id)
              )
            ) OR (
              ingredient_tasting_note_id IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM ingredient_tasting_notes itn
                WHERE itn.id = ingredient_tasting_note_id
                  AND public.can_access_tasting_session(itn.session_id)
              )
            )
          )
    """)
    _exec("""
        CREATE POLICY tasting_note_images_insert ON tasting_note_images
          FOR INSERT TO authenticated
          WITH CHECK (
            (
              tasting_note_id IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM tasting_notes tn
                WHERE tn.id = tasting_note_id
                  AND (tn.user_id = auth.uid()::text OR public.is_admin())
              )
            ) OR (
              ingredient_tasting_note_id IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM ingredient_tasting_notes itn
                WHERE itn.id = ingredient_tasting_note_id
                  AND (itn.user_id = auth.uid()::text OR public.is_admin())
              )
            )
          )
    """)
    _exec("""
        CREATE POLICY tasting_note_images_delete ON tasting_note_images
          FOR DELETE TO authenticated
          USING (
            (
              tasting_note_id IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM tasting_notes tn
                WHERE tn.id = tasting_note_id
                  AND (tn.user_id = auth.uid()::text OR public.is_admin())
              )
            ) OR (
              ingredient_tasting_note_id IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM ingredient_tasting_notes itn
                WHERE itn.id = ingredient_tasting_note_id
                  AND (itn.user_id = auth.uid()::text OR public.is_admin())
              )
            )
          )
    """)

    # -----------------------------------------------------------------------
    # recipe_tastings  (session–recipe many-to-many)
    # -----------------------------------------------------------------------

    _enable_rls('recipe_tastings')

    _exec("""
        CREATE POLICY recipe_tastings_select ON recipe_tastings
          FOR SELECT TO authenticated
          USING (public.can_access_tasting_session(tasting_session_id))
    """)
    _exec("""
        CREATE POLICY recipe_tastings_insert ON recipe_tastings
          FOR INSERT TO authenticated
          WITH CHECK (public.owns_tasting_session(tasting_session_id))
    """)
    _exec("""
        CREATE POLICY recipe_tastings_delete ON recipe_tastings
          FOR DELETE TO authenticated
          USING (public.owns_tasting_session(tasting_session_id))
    """)

    # -----------------------------------------------------------------------
    # ingredient_tastings  (session–ingredient many-to-many)
    # -----------------------------------------------------------------------

    _enable_rls('ingredient_tastings')

    _exec("""
        CREATE POLICY ingredient_tastings_select ON ingredient_tastings
          FOR SELECT TO authenticated
          USING (public.can_access_tasting_session(tasting_session_id))
    """)
    _exec("""
        CREATE POLICY ingredient_tastings_insert ON ingredient_tastings
          FOR INSERT TO authenticated
          WITH CHECK (public.owns_tasting_session(tasting_session_id))
    """)
    _exec("""
        CREATE POLICY ingredient_tastings_delete ON ingredient_tastings
          FOR DELETE TO authenticated
          USING (public.owns_tasting_session(tasting_session_id))
    """)

    # -----------------------------------------------------------------------
    # ingredient_tasting_notes
    # -----------------------------------------------------------------------

    _enable_rls('ingredient_tasting_notes')

    _exec("""
        CREATE POLICY ingredient_tasting_notes_select ON ingredient_tasting_notes
          FOR SELECT TO authenticated
          USING (public.can_access_tasting_session(session_id))
    """)
    _exec("""
        CREATE POLICY ingredient_tasting_notes_insert ON ingredient_tasting_notes
          FOR INSERT TO authenticated
          WITH CHECK (
              public.can_access_tasting_session(session_id)
              AND (user_id = auth.uid()::text OR public.is_admin())
          )
    """)
    _exec("""
        CREATE POLICY ingredient_tasting_notes_update ON ingredient_tasting_notes
          FOR UPDATE TO authenticated
          USING (user_id = auth.uid()::text OR public.is_admin())
          WITH CHECK (user_id = auth.uid()::text OR public.is_admin())
    """)
    _exec("""
        CREATE POLICY ingredient_tasting_notes_delete ON ingredient_tasting_notes
          FOR DELETE TO authenticated
          USING (user_id = auth.uid()::text OR public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # menus  (structured outlet menu, manager-owned)
    # -----------------------------------------------------------------------

    _enable_rls('menus')

    # Creator or any manager/admin can read menus
    _exec("""
        CREATE POLICY menus_select ON menus
          FOR SELECT TO authenticated
          USING (created_by = auth.uid()::text OR public.is_manager_or_admin())
    """)
    # Only managers/admins can create menus, and they must own the row
    _exec("""
        CREATE POLICY menus_insert ON menus
          FOR INSERT TO authenticated
          WITH CHECK (created_by = auth.uid()::text AND public.is_manager_or_admin())
    """)
    # Creator or admin can edit
    _exec("""
        CREATE POLICY menus_update ON menus
          FOR UPDATE TO authenticated
          USING (created_by = auth.uid()::text OR public.is_admin())
          WITH CHECK (created_by = auth.uid()::text OR public.is_admin())
    """)
    _exec("""
        CREATE POLICY menus_delete ON menus
          FOR DELETE TO authenticated
          USING (created_by = auth.uid()::text OR public.is_admin())
    """)

    # -----------------------------------------------------------------------
    # menu_sections
    # -----------------------------------------------------------------------

    _enable_rls('menu_sections')

    _exec("""
        CREATE POLICY menu_sections_select ON menu_sections
          FOR SELECT TO authenticated
          USING (public.can_access_menu(menu_id))
    """)
    _exec("""
        CREATE POLICY menu_sections_insert ON menu_sections
          FOR INSERT TO authenticated
          WITH CHECK (public.can_access_menu(menu_id))
    """)
    _exec("""
        CREATE POLICY menu_sections_update ON menu_sections
          FOR UPDATE TO authenticated
          USING (public.can_access_menu(menu_id))
          WITH CHECK (public.can_access_menu(menu_id))
    """)
    _exec("""
        CREATE POLICY menu_sections_delete ON menu_sections
          FOR DELETE TO authenticated
          USING (public.can_access_menu(menu_id))
    """)

    # -----------------------------------------------------------------------
    # menu_items
    # -----------------------------------------------------------------------

    _enable_rls('menu_items')

    _exec("""
        CREATE POLICY menu_items_select ON menu_items
          FOR SELECT TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM menu_sections ms
              WHERE ms.id = section_id
                AND public.can_access_menu(ms.menu_id)
            )
          )
    """)
    _exec("""
        CREATE POLICY menu_items_insert ON menu_items
          FOR INSERT TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM menu_sections ms
              WHERE ms.id = section_id
                AND public.can_access_menu(ms.menu_id)
            )
          )
    """)
    _exec("""
        CREATE POLICY menu_items_update ON menu_items
          FOR UPDATE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM menu_sections ms
              WHERE ms.id = section_id
                AND public.can_access_menu(ms.menu_id)
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM menu_sections ms
              WHERE ms.id = section_id
                AND public.can_access_menu(ms.menu_id)
            )
          )
    """)
    _exec("""
        CREATE POLICY menu_items_delete ON menu_items
          FOR DELETE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM menu_sections ms
              WHERE ms.id = section_id
                AND public.can_access_menu(ms.menu_id)
            )
          )
    """)

    # -----------------------------------------------------------------------
    # menu_outlets
    # -----------------------------------------------------------------------

    _enable_rls('menu_outlets')

    _exec("""
        CREATE POLICY menu_outlets_select ON menu_outlets
          FOR SELECT TO authenticated
          USING (public.can_access_menu(menu_id))
    """)
    _exec("""
        CREATE POLICY menu_outlets_insert ON menu_outlets
          FOR INSERT TO authenticated
          WITH CHECK (public.can_access_menu(menu_id))
    """)
    _exec("""
        CREATE POLICY menu_outlets_update ON menu_outlets
          FOR UPDATE TO authenticated
          USING (public.can_access_menu(menu_id))
          WITH CHECK (public.can_access_menu(menu_id))
    """)
    _exec("""
        CREATE POLICY menu_outlets_delete ON menu_outlets
          FOR DELETE TO authenticated
          USING (public.can_access_menu(menu_id))
    """)

    # -----------------------------------------------------------------------
    # menus_sketch  (freeform canvas — no individual owner field)
    # -----------------------------------------------------------------------

    _enable_rls('menus_sketch')

    # All authenticated users can view sketches
    _exec("""
        CREATE POLICY menus_sketch_select ON menus_sketch
          FOR SELECT TO authenticated
          USING (true)
    """)
    # Only managers and admins can create/modify sketches
    _exec("""
        CREATE POLICY menus_sketch_insert ON menus_sketch
          FOR INSERT TO authenticated
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY menus_sketch_update ON menus_sketch
          FOR UPDATE TO authenticated
          USING (public.is_manager_or_admin())
          WITH CHECK (public.is_manager_or_admin())
    """)
    _exec("""
        CREATE POLICY menus_sketch_delete ON menus_sketch
          FOR DELETE TO authenticated
          USING (public.is_manager_or_admin())
    """)


# ---------------------------------------------------------------------------
# downgrade
# ---------------------------------------------------------------------------

def downgrade() -> None:

    tables = [
        'users',
        'recipes',
        'recipe_ingredients',
        'recipe_images',
        'recipe_recipes',
        'recipe_recipe_categories',
        'recipe_outlets',
        'ingredients',
        'categories',
        'allergens',
        'ingredient_allergens',
        'recipe_categories',
        'suppliers',
        'supplier_ingredients',
        'outlet_supplier_ingredient',
        'supplier_ingredient_tags',
        'supplier_ingredient_supplier_ingredient_tags',
        'outlets',
        'tasting_sessions',
        'tasting_users',
        'tasting_notes',
        'tasting_note_images',
        'recipe_tastings',
        'ingredient_tastings',
        'ingredient_tasting_notes',
        'menus',
        'menu_sections',
        'menu_items',
        'menu_outlets',
        'menus_sketch',
    ]

    for table in tables:
        _drop_policies(table)
        _disable_rls(table)

    _exec("DROP FUNCTION IF EXISTS public.can_access_menu(integer)")
    _exec("DROP FUNCTION IF EXISTS public.owns_tasting_session(integer)")
    _exec("DROP FUNCTION IF EXISTS public.can_access_tasting_session(integer)")
    _exec("DROP FUNCTION IF EXISTS public.owns_recipe(integer)")
    _exec("DROP FUNCTION IF EXISTS public.can_access_recipe(integer)")
    _exec("DROP FUNCTION IF EXISTS public.is_manager_or_admin()")
    _exec("DROP FUNCTION IF EXISTS public.is_admin()")
    _exec("DROP FUNCTION IF EXISTS public.current_user_id()")
