-- One-off production reset #2, 2026-10-28. Run AFTER 2026-10-28_reset_ingredients.sql
-- and BEFORE the FMH re-import.
--
-- Removed:
--   * dishes (recipes) not used on any menu sketch or menu, with their sub-recipe
--     links, outlet links, image rows, category links, tasting dish rows, tasting
--     notes and note-image rows
--   * tasting sessions left with no dishes (plus their participants and notes)
--   * all ingredient categories, all dish categories, all suppliers
-- Kept:
--   * dishes used on a menu sketch or menu, plus any sub-recipe or fork ancestor
--     they depend on, so the sketches keep their dish names
--   * menus, menu sketches, users, outlets, allergens
--
-- Not touched: image files in the `prepper` storage bucket. Deleted rows leave
-- their files behind; clean the bucket up separately if wanted.
--
-- Backup: relies on Supabase backups. Run in the Supabase SQL editor for the
-- production project: step 1 on its own, then step 2 on its own.

-- ── Step 1: preview (read-only) ────────────────────────────────────────────
WITH RECURSIVE
  edges(src, dst) AS (
    SELECT parent_recipe_id, child_recipe_id FROM recipe_recipes
    UNION ALL
    SELECT id, root_id FROM recipes WHERE root_id IS NOT NULL
  ),
  keep(id) AS (
    SELECT recipe_id FROM menu_sketch_section_item WHERE recipe_id IS NOT NULL
    UNION
    SELECT recipe_id FROM menu_items WHERE recipe_id IS NOT NULL
    UNION
    SELECT e.dst FROM edges e JOIN keep k ON e.src = k.id
  ),
  doomed AS (SELECT id FROM recipes WHERE id NOT IN (SELECT id FROM keep))
SELECT 'dishes kept (on a menu or needed by one)' AS item, count(*) AS rows FROM keep
UNION ALL SELECT 'dishes to delete', count(*) FROM doomed
UNION ALL SELECT 'tasting notes to delete', count(*) FROM tasting_notes WHERE recipe_id IN (SELECT id FROM doomed)
UNION ALL SELECT 'tasting dish rows to delete', count(*) FROM recipe_tastings WHERE recipe_id IN (SELECT id FROM doomed)
UNION ALL SELECT 'ingredient categories to delete', count(*) FROM categories
UNION ALL SELECT 'dish categories to delete', count(*) FROM recipe_categories
UNION ALL SELECT 'suppliers to delete', count(*) FROM suppliers
UNION ALL SELECT 'ingredients still present (must be 0)', count(*) FROM ingredients;

-- ── Step 2: reset (one transaction; any error rolls everything back) ───────
BEGIN;

CREATE TEMP TABLE doomed_recipes ON COMMIT DROP AS
WITH RECURSIVE
  edges(src, dst) AS (
    SELECT parent_recipe_id, child_recipe_id FROM recipe_recipes
    UNION ALL
    SELECT id, root_id FROM recipes WHERE root_id IS NOT NULL
  ),
  keep(id) AS (
    SELECT recipe_id FROM menu_sketch_section_item WHERE recipe_id IS NOT NULL
    UNION
    SELECT recipe_id FROM menu_items WHERE recipe_id IS NOT NULL
    UNION
    SELECT e.dst FROM edges e JOIN keep k ON e.src = k.id
  )
SELECT id FROM recipes WHERE id NOT IN (SELECT id FROM keep);

-- Tasting data for deleted dishes
DELETE FROM tasting_note_images
  WHERE tasting_note_id IN (SELECT id FROM tasting_notes WHERE recipe_id IN (SELECT id FROM doomed_recipes));
DELETE FROM tasting_notes WHERE recipe_id IN (SELECT id FROM doomed_recipes);
DELETE FROM recipe_tastings WHERE recipe_id IN (SELECT id FROM doomed_recipes);

-- Tasting sessions left with no dishes (ingredient tastings were cleared by reset #1)
CREATE TEMP TABLE empty_sessions ON COMMIT DROP AS
SELECT s.id FROM tasting_sessions s
WHERE NOT EXISTS (SELECT 1 FROM recipe_tastings rt WHERE rt.tasting_session_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM ingredient_tastings it WHERE it.tasting_session_id = s.id);
DELETE FROM tasting_note_images
  WHERE tasting_note_id IN (SELECT id FROM tasting_notes WHERE session_id IN (SELECT id FROM empty_sessions));
DELETE FROM tasting_notes WHERE session_id IN (SELECT id FROM empty_sessions);
DELETE FROM tasting_users WHERE tasting_session_id IN (SELECT id FROM empty_sessions);
DELETE FROM tasting_sessions WHERE id IN (SELECT id FROM empty_sessions);

-- Dish categories (all), and every other link from a deleted dish
DELETE FROM recipe_recipe_categories;
DELETE FROM recipe_categories;
DELETE FROM recipe_recipes
  WHERE parent_recipe_id IN (SELECT id FROM doomed_recipes)
     OR child_recipe_id IN (SELECT id FROM doomed_recipes);
DELETE FROM recipe_outlets WHERE recipe_id IN (SELECT id FROM doomed_recipes);
DELETE FROM recipe_images WHERE recipe_id IN (SELECT id FROM doomed_recipes);
UPDATE recipes SET root_id = NULL
  WHERE root_id IN (SELECT id FROM doomed_recipes) AND id NOT IN (SELECT id FROM doomed_recipes);
DELETE FROM recipes WHERE id IN (SELECT id FROM doomed_recipes);

-- Ingredient categories and suppliers (nothing references them after reset #1)
DELETE FROM categories;
DELETE FROM supplier_ingredient_tags;
DELETE FROM suppliers;

COMMIT;

SELECT 'recipes' AS table_name, count(*) AS rows FROM recipes
UNION ALL SELECT 'menu sketch items without a dish', count(*) FROM menu_sketch_section_item WHERE recipe_id IS NULL
UNION ALL SELECT 'tasting_sessions', count(*) FROM tasting_sessions
UNION ALL SELECT 'tasting_notes', count(*) FROM tasting_notes
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'recipe_categories', count(*) FROM recipe_categories
UNION ALL SELECT 'suppliers', count(*) FROM suppliers;
