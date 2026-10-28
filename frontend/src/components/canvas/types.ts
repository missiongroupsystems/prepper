import type { Ingredient, Recipe, RecipeStatus } from '@/types';

/** The library panel's "Add" buttons dispatch these window events; the canvas stages the item. */
export const CANVAS_ADD_INGREDIENT_EVENT = 'canvas-add-ingredient';
export const CANVAS_ADD_RECIPE_EVENT = 'canvas-add-recipe';

/** An ingredient staged on the canvas, priced in its current display unit. */
export interface StagedIngredient {
  /** Unique id for this staged row; `existing-ing-{linkId}` once loaded from the server. */
  id: string;
  ingredient: Ingredient;
  quantity: number;
  /** Display/recipe unit; may differ from `base_unit` after a unit switch. */
  unit: string;
  /** Price per current display unit; converts with the unit. */
  unitPrice: number | null;
  wastage_percentage: number;
  /** The supplier picked on the card; null means the median of all suppliers. */
  selectedSupplierId: number | null;
}

/** A sub-recipe staged on the canvas; `existing-rec-{linkId}` once loaded from the server. */
export interface StagedRecipe {
  id: string;
  recipe: Recipe;
  quantity: number;
}

export type DragItem =
  | { type: 'panel-ingredient'; ingredient: Ingredient }
  | { type: 'panel-recipe'; recipe: Recipe }
  | { type: 'staged-ingredient'; stagedId: string }
  | { type: 'staged-recipe'; stagedId: string };

export interface RecipeMetadata {
  name: string;
  yield_quantity: number;
  yield_unit: string;
  status: RecipeStatus;
  is_public: boolean;
  selling_price: number;
}

export const DEFAULT_METADATA: RecipeMetadata = {
  name: 'Untitled Dish',
  yield_quantity: 10,
  yield_unit: 'portion',
  status: 'draft',
  is_public: false,
  selling_price: 0,
};

/** What the canvas looked like when it was loaded or last saved — the unsaved-changes baseline. */
export interface CanvasSnapshot {
  ingredientIds: string[];
  ingredientQuantities: Record<string, number>;
  recipeIds: string[];
  recipeQuantities: Record<string, number>;
  metadata: RecipeMetadata;
}

/** Every edit a staged row can make, keyed by the staged row's id. */
export interface StagedItemActions {
  onRemoveIngredient: (id: string) => void;
  onRemoveRecipe: (id: string) => void;
  onIngredientQuantityChange: (id: string, quantity: number) => void;
  onIngredientWastageChange: (id: string, wastage: number) => void;
  onIngredientUnitChange: (id: string, unit: string) => void;
  onSupplierSelect: (id: string, supplierId: number | null) => void;
  onRecipeQuantityChange: (id: string, quantity: number) => void;
  /** Swap a row's ingredient; picking a recipe moves the row to the sub-recipes. */
  onIngredientSelect: (id: string, ingredientOrRecipe: Ingredient | Recipe) => void;
  /** Swap a row's recipe; picking an ingredient moves the row to the ingredients. */
  onRecipeSelect: (id: string, recipeOrIngredient: Recipe | Ingredient) => void;
}

/** Recipe lookups the staged recipe views show beside a sub-recipe. */
export interface RecipeLabels {
  getOutletNamesForRecipe: (recipeId: number) => string[];
  getCategoryNamesForRecipe: (recipeId: number) => string[];
}
