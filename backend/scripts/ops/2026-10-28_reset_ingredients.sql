-- One-off production reset, 2026-10-28: remove every ingredient and the supplier
-- catalogue priced from it, ahead of re-importing the latest FMH ingredient list.
--
-- Removed: ingredients, supplier catalogue lines (+ their outlet links and tags),
--          ingredient allergen tags, ingredient tastings (+ notes and note images),
--          recipe ingredient lines. Cached recipe cost_price is cleared.
-- Kept:    suppliers, categories, allergens, recipes (names, yields, steps,
--          sub-recipes), tastings, menus, menu sketches, users, outlets.
--
-- Backup: relies on Supabase backups. Confirm one exists (Database → Backups)
-- before running step 2.
--
-- Run in the Supabase SQL editor for the production project. Run step 1 on its
-- own, then step 2 on its own.

-- ── Step 1: preview (read-only) ────────────────────────────────────────────
SELECT 'ingredients' AS table_name, count(*) AS rows FROM ingredients
UNION ALL SELECT 'supplier_ingredients', count(*) FROM supplier_ingredients
UNION ALL SELECT 'outlet_supplier_ingredient', count(*) FROM outlet_supplier_ingredient
UNION ALL SELECT 'supplier_ingredient_supplier_ingredient_tags', count(*) FROM supplier_ingredient_supplier_ingredient_tags
UNION ALL SELECT 'ingredient_allergens', count(*) FROM ingredient_allergens
UNION ALL SELECT 'ingredient_tastings', count(*) FROM ingredient_tastings
UNION ALL SELECT 'ingredient_tasting_notes', count(*) FROM ingredient_tasting_notes
UNION ALL SELECT 'tasting_note_images (ingredient notes)', count(*) FROM tasting_note_images WHERE ingredient_tasting_note_id IS NOT NULL
UNION ALL SELECT 'recipe_ingredients', count(*) FROM recipe_ingredients
UNION ALL SELECT 'recipes with cached cost_price', count(*) FROM recipes WHERE cost_price IS NOT NULL;

-- ── Step 2: reset (one transaction; any error rolls everything back) ───────
BEGIN;

DELETE FROM tasting_note_images WHERE ingredient_tasting_note_id IS NOT NULL;
DELETE FROM ingredient_tasting_notes;
DELETE FROM ingredient_tastings;
DELETE FROM ingredient_allergens;

DELETE FROM recipe_ingredients;
UPDATE recipes SET cost_price = NULL WHERE cost_price IS NOT NULL;

DELETE FROM supplier_ingredient_supplier_ingredient_tags;
DELETE FROM outlet_supplier_ingredient;
DELETE FROM supplier_ingredients;

UPDATE ingredients SET master_ingredient_id = NULL WHERE master_ingredient_id IS NOT NULL;
DELETE FROM ingredients;

COMMIT;

SELECT 'ingredients' AS table_name, count(*) AS rows FROM ingredients
UNION ALL SELECT 'supplier_ingredients', count(*) FROM supplier_ingredients
UNION ALL SELECT 'recipe_ingredients', count(*) FROM recipe_ingredients
UNION ALL SELECT 'recipes', count(*) FROM recipes
UNION ALL SELECT 'suppliers', count(*) FROM suppliers
UNION ALL SELECT 'categories', count(*) FROM categories;
