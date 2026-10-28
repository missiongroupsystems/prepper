/**
 * Pure canvas model: pricing, staging and the unsaved-changes check. No React, so the rules the
 * canvas shows (line cost, batch cost, "Unsaved") are testable on their own.
 */
import { displayNameParts } from '@/lib/format/displayName';
import { convertUnitPrice } from '@/lib/unitConversion';
import type { Ingredient, Recipe, RecipeIngredient, SubRecipe, SupplierIngredient } from '@/types';
import { DEFAULT_METADATA, type CanvasSnapshot, type RecipeMetadata, type StagedIngredient, type StagedRecipe } from './types';

/** Two prices closer than this are the same price (float noise from unit conversion). */
const PRICE_EPSILON = 0.0001;

export const EXISTING_INGREDIENT_PREFIX = 'existing-ing-';
export const EXISTING_RECIPE_PREFIX = 'existing-rec-';

/** How an item is named in labels and messages: sentence case, any imported item code dropped. */
export function itemLabel(name: string): string {
  return displayNameParts(name).name;
}

/** A supplier's price per pack unit. */
export function supplierUnitCost(s: SupplierIngredient): number {
  return s.pack_size > 0 ? s.price_per_pack / s.pack_size : 0;
}

/**
 * The base cost for a staged ingredient:
 *  1. a selected supplier → that supplier's cost;
 *  2. no selection but suppliers exist → the median cost;
 *  3. no suppliers → `ingredient.cost_per_base_unit`.
 */
export function getIngredientUnitCost(
  staged: StagedIngredient,
  suppliers: SupplierIngredient[]
): { cost: number | null; label: string; supplierId: number | null } {
  if (staged.selectedSupplierId != null) {
    const selected = suppliers.find((s) => s.supplier_id === staged.selectedSupplierId);
    if (selected) {
      return { cost: supplierUnitCost(selected), label: selected.supplier_name ?? 'Supplier', supplierId: selected.supplier_id };
    }
  }

  if (suppliers.length > 0) {
    const costs = suppliers.map(supplierUnitCost).sort((a, b) => a - b);
    const mid = Math.floor(costs.length / 2);
    const median = costs.length % 2 !== 0 ? costs[mid] : (costs[mid - 1] + costs[mid]) / 2;
    return { cost: median, label: 'Median', supplierId: null };
  }

  return { cost: staged.ingredient.cost_per_base_unit, label: 'Base', supplierId: null };
}

/** The staged row's price after picking a supplier (null = median), in its display unit. */
export function priceForSupplier(
  item: StagedIngredient,
  supplierId: number | null,
  suppliers: SupplierIngredient[]
): StagedIngredient {
  const updated = { ...item, selectedSupplierId: supplierId };
  const { cost: baseCost } = getIngredientUnitCost(updated, suppliers);
  const baseUnit =
    supplierId != null
      ? (suppliers.find((s) => s.supplier_id === supplierId)?.pack_unit ?? item.ingredient.base_unit)
      : item.ingredient.base_unit;
  const unitPrice = baseCost != null ? (convertUnitPrice(baseCost, baseUnit, item.unit) ?? baseCost) : null;
  return { ...updated, unitPrice };
}

/**
 * The median supplier price for a row with no supplier picked, once suppliers load. Returns the
 * row unchanged when a supplier is picked, none exist, or the price is already the same.
 */
export function withMedianPrice(item: StagedIngredient, suppliers: SupplierIngredient[] | undefined): StagedIngredient {
  if (item.selectedSupplierId != null) return item;
  if (!suppliers || suppliers.length === 0) return item;
  const { cost: baseCost } = getIngredientUnitCost(item, suppliers);
  if (baseCost == null) return item;
  const converted = convertUnitPrice(baseCost, item.ingredient.base_unit, item.unit) ?? baseCost;
  if (item.unitPrice != null && Math.abs(item.unitPrice - converted) < PRICE_EPSILON) return item;
  return { ...item, unitPrice: converted };
}

/** Batch cost of the canvas: wastage-adjusted ingredient lines plus sub-recipe portions. */
export function calculateCanvasCost(
  stagedIngredients: StagedIngredient[],
  stagedRecipes: StagedRecipe[],
  allRecipes?: Recipe[]
): number {
  let totalCost = 0;

  for (const staged of stagedIngredients) {
    if (staged.unitPrice != null) {
      const wastageMultiplier = staged.wastage_percentage > 0 ? 1 / (1 - staged.wastage_percentage / 100) : 1;
      totalCost += staged.quantity * staged.unitPrice * wastageMultiplier;
    }
  }

  for (const staged of stagedRecipes) {
    const recipe = allRecipes?.find((r) => r.id === staged.recipe.id);
    // cost_price is already the cost per portion (set by persist_cost_snapshot on the backend).
    if (recipe?.cost_price != null) totalCost += staged.quantity * recipe.cost_price;
  }

  return totalCost;
}

export function newStagedIngredient(ingredient: Ingredient, quantity = 1, id?: string): StagedIngredient {
  return {
    id: id ?? `ing-${Date.now()}-${Math.random()}`,
    ingredient,
    quantity,
    unit: ingredient.base_unit,
    unitPrice: ingredient.cost_per_base_unit ?? null,
    wastage_percentage: 0,
    selectedSupplierId: null,
  };
}

export function newStagedRecipe(recipe: Recipe, quantity = 1, id?: string): StagedRecipe {
  return { id: id ?? `rec-${Date.now()}-${Math.random()}`, recipe, quantity };
}

/** Server recipe-ingredient links as staged rows, prices converted to each row's unit. */
export function stagedIngredientsFromServer(recipeIngredients: RecipeIngredient[]): StagedIngredient[] {
  return recipeIngredients.map((ri) => {
    const baseUnit = ri.base_unit || ri.unit;
    const rawPrice = ri.unit_price;
    const displayPrice =
      rawPrice != null && baseUnit !== ri.unit ? (convertUnitPrice(rawPrice, baseUnit, ri.unit) ?? rawPrice) : rawPrice;
    return {
      id: `${EXISTING_INGREDIENT_PREFIX}${ri.id}`,
      ingredient: ri.ingredient || {
        id: ri.ingredient_id,
        name: `Ingredient #${ri.ingredient_id}`,
        base_unit: ri.unit,
        cost_per_base_unit: ri.unit_price,
        is_active: true,
        is_halal: false,
        category_id: null,
        created_at: '',
        updated_at: '',
      },
      quantity: ri.quantity,
      unit: ri.unit,
      unitPrice: displayPrice ?? null,
      wastage_percentage: ri.wastage_percentage,
      selectedSupplierId: ri.supplier_id ?? null,
    };
  });
}

/** Server sub-recipe links as staged rows; a child missing from `recipes` gets a placeholder. */
export function stagedRecipesFromServer(subRecipes: SubRecipe[], recipes: Recipe[] | undefined): StagedRecipe[] {
  return subRecipes.map((sr) => ({
    id: `${EXISTING_RECIPE_PREFIX}${sr.id}`,
    recipe:
      recipes?.find((r) => r.id === sr.child_recipe_id) ||
      ({
        id: sr.child_recipe_id,
        name: `Recipe #${sr.child_recipe_id}`,
        instructions_raw: null,
        instructions_structured: null,
        yield_quantity: 1,
        yield_unit: 'portion',
        cost_price: null,
        selling_price_est: null,
        status: 'draft' as const,
        is_prep_recipe: false,
        is_public: false,
        owner_id: null,
        version: 1,
        root_id: null,
        image_url: null,
        description: null,
        summary_feedback: null,
        rnd_started: false,
        review_ready: false,
        created_at: '',
        updated_at: '',
        created_by: '',
      } as Recipe),
    quantity: sr.quantity,
  }));
}

export function snapshotCanvas(
  stagedIngredients: StagedIngredient[],
  stagedRecipes: StagedRecipe[],
  metadata: RecipeMetadata
): CanvasSnapshot {
  const ingredientQuantities: Record<string, number> = {};
  stagedIngredients.forEach((ing) => {
    ingredientQuantities[ing.ingredient.id.toString()] = ing.quantity;
  });
  const recipeQuantities: Record<string, number> = {};
  stagedRecipes.forEach((rec) => {
    recipeQuantities[rec.recipe.id.toString()] = rec.quantity;
  });
  return {
    ingredientIds: stagedIngredients.map((ing) => ing.ingredient.id.toString()),
    ingredientQuantities,
    recipeIds: stagedRecipes.map((rec) => rec.recipe.id.toString()),
    recipeQuantities,
    metadata,
  };
}

function metadataDiffers(a: RecipeMetadata, b: RecipeMetadata): boolean {
  return (
    a.name !== b.name ||
    a.yield_quantity !== b.yield_quantity ||
    a.yield_unit !== b.yield_unit ||
    a.status !== b.status ||
    a.is_public !== b.is_public
  );
}

function sameIds(current: string[], initial: string[]): boolean {
  if (current.length !== initial.length) return false;
  return current.every((id) => initial.includes(id)) && initial.every((id) => current.includes(id));
}

/**
 * Whether the canvas differs from its baseline: metadata (not selling price), which items are
 * staged, and their quantities. With no baseline yet, anything staged or edited counts.
 */
export function hasCanvasChanges(
  baseline: CanvasSnapshot | null,
  metadata: RecipeMetadata,
  stagedIngredients: StagedIngredient[],
  stagedRecipes: StagedRecipe[]
): boolean {
  if (!baseline) {
    return stagedIngredients.length > 0 || stagedRecipes.length > 0 || metadataDiffers(metadata, DEFAULT_METADATA);
  }
  if (metadataDiffers(metadata, baseline.metadata)) return true;

  const ingredientIds = stagedIngredients.map((ing) => ing.ingredient.id.toString());
  if (!sameIds(ingredientIds, baseline.ingredientIds)) return true;
  if (stagedIngredients.some((ing) => baseline.ingredientQuantities[ing.ingredient.id.toString()] !== ing.quantity)) {
    return true;
  }

  const recipeIds = stagedRecipes.map((rec) => rec.recipe.id.toString());
  if (!sameIds(recipeIds, baseline.recipeIds)) return true;
  return stagedRecipes.some((rec) => baseline.recipeQuantities[rec.recipe.id.toString()] !== rec.quantity);
}
