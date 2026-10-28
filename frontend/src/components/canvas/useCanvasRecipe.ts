'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppState } from '@/lib/store';
import { useRecipe, useRecipeIngredients, useSubRecipes } from '@/lib/hooks';
import type { Recipe } from '@/types';
import { hasCanvasChanges, snapshotCanvas, stagedIngredientsFromServer, stagedRecipesFromServer } from './canvasModel';
import { DEFAULT_METADATA, type CanvasSnapshot, type RecipeMetadata } from './types';
import type { useStagedItems } from './useStagedItems';

type StagedItems = ReturnType<typeof useStagedItems>;

const EMPTY_SNAPSHOT: CanvasSnapshot = {
  ingredientIds: [],
  ingredientQuantities: {},
  recipeIds: [],
  recipeQuantities: {},
  metadata: DEFAULT_METADATA,
};

function metadataOf(recipe: Recipe): RecipeMetadata {
  return {
    name: recipe.name,
    yield_quantity: recipe.yield_quantity,
    yield_unit: recipe.yield_unit,
    status: recipe.status,
    is_public: recipe.is_public,
    selling_price: recipe.selling_price_est ?? 0,
  };
}

/**
 * Loads the selected recipe onto the canvas and tracks the baseline it was loaded (or last saved)
 * from, so the canvas knows when it has unsaved changes and Reset knows what to go back to.
 */
export function useCanvasRecipe(staged: StagedItems, recipes: Recipe[] | undefined) {
  const { selectedRecipeId, setCanvasHasUnsavedChanges } = useAppState();
  const { data: selectedRecipeData } = useRecipe(selectedRecipeId);
  const { data: recipeIngredients } = useRecipeIngredients(selectedRecipeId);
  const { data: subRecipes } = useSubRecipes(selectedRecipeId);
  const { stagedIngredients, stagedRecipes, setStagedIngredients, setStagedRecipes, fetchSuppliersForIngredient } =
    staged;

  const [metadata, setMetadata] = useState<RecipeMetadata>(DEFAULT_METADATA);
  const [loadedRecipeId, setLoadedRecipeId] = useState<number | null>(null);
  const [baseline, setBaseline] = useState<CanvasSnapshot | null>(null);

  // Show the recipe's name and yield as soon as it loads, before its ingredients do, so the
  // header never flashes "Untitled Dish".
  useEffect(() => {
    if (selectedRecipeId === null || !selectedRecipeData || loadedRecipeId === selectedRecipeId) return;
    setMetadata(metadataOf(selectedRecipeData));
  }, [selectedRecipeId, selectedRecipeData, loadedRecipeId]);

  // Load the selected recipe's ingredients and sub-recipes; a new recipe clears the canvas.
  useEffect(() => {
    if (selectedRecipeId === null) {
      if (loadedRecipeId !== null) {
        setStagedIngredients([]);
        setStagedRecipes([]);
        setMetadata(DEFAULT_METADATA);
        setLoadedRecipeId(null);
        setBaseline(EMPTY_SNAPSHOT);
      }
      return;
    }
    if (loadedRecipeId === selectedRecipeId) return;
    if (!recipeIngredients || !subRecipes || !selectedRecipeData) return;

    const loadedMetadata = metadataOf(selectedRecipeData);
    const loadedIngredients = stagedIngredientsFromServer(recipeIngredients);
    const loadedRecipes = stagedRecipesFromServer(subRecipes, recipes);
    for (const ri of recipeIngredients) fetchSuppliersForIngredient(ri.ingredient_id);

    setMetadata(loadedMetadata);
    setStagedIngredients(loadedIngredients);
    setStagedRecipes(loadedRecipes);
    setLoadedRecipeId(selectedRecipeId);
    setBaseline(snapshotCanvas(loadedIngredients, loadedRecipes, loadedMetadata));
    // `recipes` is read once at load time; a later page of recipes must not reload the canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecipeId, selectedRecipeData, recipeIngredients, subRecipes, loadedRecipeId, fetchSuppliersForIngredient]);

  const onMetadataChange = useCallback((updates: Partial<RecipeMetadata>) => {
    setMetadata((prev) => ({ ...prev, ...updates }));
  }, []);

  /** Back to the baseline: its metadata, and the server's items if it had any. */
  const reset = useCallback(() => {
    if (!baseline) {
      setMetadata(DEFAULT_METADATA);
      setStagedIngredients([]);
      setStagedRecipes([]);
      return;
    }
    setMetadata(baseline.metadata);
    setStagedIngredients(
      selectedRecipeId && recipeIngredients && baseline.ingredientIds.length > 0
        ? stagedIngredientsFromServer(recipeIngredients)
        : []
    );
    setStagedRecipes(
      selectedRecipeId && subRecipes && baseline.recipeIds.length > 0 ? stagedRecipesFromServer(subRecipes, recipes) : []
    );
  }, [baseline, selectedRecipeId, recipeIngredients, subRecipes, recipes, setStagedIngredients, setStagedRecipes]);

  /** Empties the canvas; the metadata stays. */
  const clearAll = useCallback(() => {
    setStagedIngredients([]);
    setStagedRecipes([]);
  }, [setStagedIngredients, setStagedRecipes]);

  /** The current canvas becomes the baseline — after a save. */
  const markSaved = useCallback(() => {
    setBaseline(snapshotCanvas(stagedIngredients, stagedRecipes, metadata));
  }, [stagedIngredients, stagedRecipes, metadata]);

  const hasUnsavedChanges = hasCanvasChanges(baseline, metadata, stagedIngredients, stagedRecipes);

  // The tab-switch prompt reads this from the store.
  useEffect(() => {
    setCanvasHasUnsavedChanges(hasUnsavedChanges);
  }, [hasUnsavedChanges, setCanvasHasUnsavedChanges]);

  return {
    selectedRecipeId,
    metadata,
    setMetadata,
    onMetadataChange,
    recipeIngredients,
    subRecipes,
    hasUnsavedChanges,
    reset,
    clearAll,
    markSaved,
  };
}
