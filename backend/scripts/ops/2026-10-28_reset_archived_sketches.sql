-- One-off production reset #3, 2026-10-28. Run after resets #1 and #2.
--
-- Archived menu sketches are ones users already deleted in the app (status
-- 'archived' is its soft delete). This removes them for good, then removes the
-- dishes that only they used.
--
-- Removed:
--   * archived menu sketches with their sections, items and item comments
--   * dishes no longer on a live (draft) sketch or a menu, with their sub-recipe
--     links, outlet links, image rows, category links, tasting dish rows,
--     tasting notes and note-image rows
--   * tasting sessions left with no dishes (plus their participants and notes)
-- Kept:
--   * draft sketches (e.g. CMC Nex Menu) and the `menus` tables
--   * dishes on those, plus any sub-recipe or fork ancestor they depend on
--
-- Not touched: image files in the `prepper` storage bucket.
--
-- Backup: relies on Supabase backups. Run in the Supabase SQL editor for the
-- production project: step 1 on its own, then step 2 on its own. Step 2 creates
-- temporary tables, so Supabase warns about RLS: choose "Run without RLS".

-- ── Step 1: preview (read-only) ────────────────────────────────────────────
WITH RECURSIVE
  live_sketches AS (SELECT id FROM menus_sketch WHERE status <> 'archived'),
  edges(src, dst) AS (
    SELECT parent_recipe_id, child_recipe_id FROM recipe_recipes
    UNION ALL
    SELECT id, root_id FROM recipes WHERE root_id IS NOT NULL
  ),
  keep(id) AS (
    SELECT i.recipe_id
      FROM menu_sketch_section_item i
      JOIN menu_sketch_section s ON s.id = i.menu_sketch_section_id
     WHERE i.recipe_id IS NOT NULL AND s.menu_sketch_id IN (SELECT id FROM live_sketches)
    UNION
    SELECT recipe_id FROM menu_items WHERE recipe_id IS NOT NULL
    UNION
    SELECT e.dst FROM edges e JOIN keep k ON e.src = k.id
  ),
  doomed AS (SELECT id FROM recipes WHERE id NOT IN (SELECT id FROM keep))
SELECT 'sketches kept: ' || coalesce(string_agg(name, ', '), '(none)') AS item, count(*) AS rows
  FROM menus_sketch WHERE status <> 'archived'
UNION ALL SELECT 'archived sketches to delete', count(*) FROM menus_sketch WHERE status = 'archived'
UNION ALL SELECT 'dishes kept', count(*) FROM keep
UNION ALL SELECT 'dishes to delete', count(*) FROM doomed
UNION ALL SELECT 'tasting notes to delete', count(*) FROM tasting_notes WHERE recipe_id IN (SELECT id FROM doomed);

-- ── Step 2: reset (one transaction; any error rolls everything back) ───────
BEGIN;

CREATE TEMP TABLE archived_sketches ON COMMIT DROP AS
SELECT id FROM menus_sketch WHERE status = 'archived';

-- Archived sketches and everything inside them
DELETE FROM menu_sketch_section_item_comments
  WHERE menu_sketch_section_item_id IN (
    SELECT i.id FROM menu_sketch_section_item i
      JOIN menu_sketch_section s ON s.id = i.menu_sketch_section_id
     WHERE s.menu_sketch_id IN (SELECT id FROM archived_sketches));
DELETE FROM menu_sketch_section_item
  WHERE menu_sketch_section_id IN (
    SELECT id FROM menu_sketch_section WHERE menu_sketch_id IN (SELECT id FROM archived_sketches));
DELETE FROM menu_sketch_section WHERE menu_sketch_id IN (SELECT id FROM archived_sketches);
UPDATE menus_sketch SET root = NULL
  WHERE root IN (SELECT id FROM archived_sketches) AND id NOT IN (SELECT id FROM archived_sketches);
DELETE FROM menus_sketch WHERE id IN (SELECT id FROM archived_sketches);

-- Dishes no longer on a live sketch or menu (same rules as reset #2)
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

SELECT 'menus_sketch' AS table_name, count(*) AS rows FROM menus_sketch
UNION ALL SELECT 'menu sketch items without a dish', count(*) FROM menu_sketch_section_item WHERE recipe_id IS NULL
UNION ALL SELECT 'recipes', count(*) FROM recipes
UNION ALL SELECT 'tasting_sessions', count(*) FROM tasting_sessions
UNION ALL SELECT 'tasting_notes', count(*) FROM tasting_notes;
