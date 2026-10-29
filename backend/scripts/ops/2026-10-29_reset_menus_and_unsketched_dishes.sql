-- One-off production reset #4, 2026-10-29. Run after resets #1–#3.
--
-- Keeps only what the remaining menu sketch (CMC Nex Menu) uses. Everything
-- else on the dish side goes.
--
-- Removed:
--   * every menu in Menus (menus, menu_sections, menu_items, menu_outlets)
--   * dishes not on a menu sketch, with their sub-recipe links, outlet links,
--     image rows, category links, tasting dish rows, tasting notes and
--     note-image rows
--   * tasting sessions left with no dishes (plus their participants and notes)
-- Kept:
--   * the menu sketch(es) and every dish on them, plus any sub-recipe or fork
--     ancestor those dishes depend on
--   * outlets, users and everything not tied to a dish
--
-- Not touched: image files in the storage bucket.
--
-- Backup: relies on Supabase backups. Run in the Supabase SQL editor for the
-- production project: step 1 on its own, check the sketch names it lists, then
-- step 2 on its own. Step 2 creates temporary tables, so Supabase warns about
-- RLS: choose "Run without RLS".

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
    SELECT e.dst FROM edges e JOIN keep k ON e.src = k.id
  ),
  doomed AS (SELECT id FROM recipes WHERE id NOT IN (SELECT id FROM keep))
SELECT 'sketches kept: ' || coalesce(string_agg(name, ', '), '(none)') AS item, count(*) AS rows
  FROM menus_sketch
UNION ALL SELECT 'menus to delete', count(*) FROM menus
UNION ALL SELECT 'dishes kept', count(*) FROM keep
UNION ALL SELECT 'dishes to delete', count(*) FROM doomed
UNION ALL SELECT 'tasting notes to delete', count(*) FROM tasting_notes WHERE recipe_id IN (SELECT id FROM doomed);

-- ── Step 2: reset (one transaction; any error rolls everything back) ───────
BEGIN;

-- Every menu in Menus
DELETE FROM menu_items;
DELETE FROM menu_sections;
DELETE FROM menu_outlets;
DELETE FROM menus;

-- Dishes not on a menu sketch (same rules as resets #2 and #3)
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
    SELECT e.dst FROM edges e JOIN keep k ON e.src = k.id
  )
SELECT id FROM recipes WHERE id NOT IN (SELECT id FROM keep);

DELETE FROM tasting_note_images
  WHERE tasting_note_id IN (SELECT id FROM tasting_notes WHERE recipe_id IN (SELECT id FROM doomed_recipes));
DELETE FROM tasting_notes WHERE recipe_id IN (SELECT id FROM doomed_recipes);
DELETE FROM recipe_tastings WHERE recipe_id IN (SELECT id FROM doomed_recipes);

CREATE TEMP TABLE empty_sessions ON COMMIT DROP AS
SELECT s.id FROM tasting_sessions s
WHERE NOT EXISTS (SELECT 1 FROM recipe_tastings rt WHERE rt.tasting_session_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM ingredient_tastings it WHERE it.tasting_session_id = s.id);
DELETE FROM tasting_note_images
  WHERE tasting_note_id IN (SELECT id FROM tasting_notes WHERE session_id IN (SELECT id FROM empty_sessions));
DELETE FROM tasting_notes WHERE session_id IN (SELECT id FROM empty_sessions);
DELETE FROM tasting_users WHERE tasting_session_id IN (SELECT id FROM empty_sessions);
DELETE FROM tasting_sessions WHERE id IN (SELECT id FROM empty_sessions);

DELETE FROM recipe_recipe_categories WHERE recipe_id IN (SELECT id FROM doomed_recipes);
DELETE FROM recipe_recipes
  WHERE parent_recipe_id IN (SELECT id FROM doomed_recipes)
     OR child_recipe_id IN (SELECT id FROM doomed_recipes);
DELETE FROM recipe_outlets WHERE recipe_id IN (SELECT id FROM doomed_recipes);
DELETE FROM recipe_images WHERE recipe_id IN (SELECT id FROM doomed_recipes);
UPDATE recipes SET root_id = NULL
  WHERE root_id IN (SELECT id FROM doomed_recipes) AND id NOT IN (SELECT id FROM doomed_recipes);
DELETE FROM recipes WHERE id IN (SELECT id FROM doomed_recipes);

COMMIT;

SELECT 'menus' AS table_name, count(*) AS rows FROM menus
UNION ALL SELECT 'menus_sketch', count(*) FROM menus_sketch
UNION ALL SELECT 'recipes', count(*) FROM recipes
UNION ALL SELECT 'tasting_sessions', count(*) FROM tasting_sessions
UNION ALL SELECT 'tasting_notes', count(*) FROM tasting_notes;
