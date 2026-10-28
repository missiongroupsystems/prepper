'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUpdateSubRecipe } from '@/lib/hooks';
import { getIngredientSuppliers } from '@/lib/api';
import { convertUnit, convertUnitPrice } from '@/lib/unitConversion';
import type { Ingredient, Recipe, SupplierIngredient } from '@/types';
import { EXISTING_RECIPE_PREFIX, itemLabel, newStagedIngredient, newStagedRecipe, priceForSupplier, withMedianPrice } from './canvasModel';
import {
  CANVAS_ADD_INGREDIENT_EVENT,
  CANVAS_ADD_RECIPE_EVENT,
  type StagedIngredient,
  type StagedItemActions,
  type StagedRecipe,
} from './types';

/** Quiet period before an existing sub-recipe's quantity is written. */
const SUB_RECIPE_AUTOSAVE_MS = 500;
/** Significant digits kept when a quantity is converted to another unit. */
const CONVERTED_QUANTITY_PRECISION = 6;

const isRecipe = (item: Ingredient | Recipe): item is Recipe => 'yield_quantity' in item;

/**
 * The staged ingredients and sub-recipes on the canvas, and every edit to them. Supplier lists
 * load lazily per ingredient; a row with no supplier picked follows the median price.
 */
export function useStagedItems(selectedRecipeId: number | null) {
  const updateSubRecipe = useUpdateSubRecipe();
  const [stagedIngredients, setStagedIngredients] = useState<StagedIngredient[]>([]);
  const [stagedRecipes, setStagedRecipes] = useState<StagedRecipe[]>([]);
  const [supplierMap, setSupplierMap] = useState<Record<number, SupplierIngredient[]>>({});
  const fetchedIdsRef = useRef<Set<number>>(new Set());
  const subRecipeUpdateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /** Loads an ingredient's suppliers once; a failure leaves the list empty. */
  const fetchSuppliersForIngredient = useCallback((ingredientId: number) => {
    if (fetchedIdsRef.current.has(ingredientId)) return;
    fetchedIdsRef.current.add(ingredientId);
    getIngredientSuppliers(ingredientId)
      .then((data) => setSupplierMap((prev) => ({ ...prev, [ingredientId]: data })))
      .catch(() => {});
  }, []);

  // When suppliers load, rows with no supplier picked take the median price.
  useEffect(() => {
    setStagedIngredients((prev) => {
      const updated = prev.map((item) => withMedianPrice(item, supplierMap[item.ingredient.id]));
      return updated.some((item, i) => item !== prev[i]) ? updated : prev;
    });
  }, [supplierMap]);

  /** Adds an ingredient, or bumps its quantity when it is already staged. */
  const stageIngredient = useCallback(
    (ingredient: Ingredient) => {
      const name = itemLabel(ingredient.name);
      const existingIndex = stagedIngredients.findIndex((s) => s.ingredient.id === ingredient.id);
      if (existingIndex >= 0) {
        setStagedIngredients((prev) =>
          prev.map((item, idx) => (idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item))
        );
        toast.success(`Increased ${name} quantity`);
        return;
      }
      setStagedIngredients((prev) => [...prev, newStagedIngredient(ingredient)]);
      fetchSuppliersForIngredient(ingredient.id);
      toast.success(`Added ${name} to canvas`);
    },
    [stagedIngredients, fetchSuppliersForIngredient]
  );

  /** Adds a sub-recipe, or bumps its quantity when it is already staged. */
  const stageRecipe = useCallback(
    (recipe: Recipe) => {
      const name = itemLabel(recipe.name);
      const existingIndex = stagedRecipes.findIndex((s) => s.recipe.id === recipe.id);
      if (existingIndex >= 0) {
        setStagedRecipes((prev) =>
          prev.map((item, idx) => (idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item))
        );
        toast.success(`Increased ${name} quantity`);
        return;
      }
      setStagedRecipes((prev) => [...prev, newStagedRecipe(recipe)]);
      toast.success(`Added ${name} to canvas`);
    },
    [stagedRecipes]
  );

  // The library panel's "Add" buttons.
  useEffect(() => {
    const onAddIngredient = (event: Event) => stageIngredient((event as CustomEvent).detail.ingredient);
    const onAddRecipe = (event: Event) => stageRecipe((event as CustomEvent).detail.recipe);
    window.addEventListener(CANVAS_ADD_INGREDIENT_EVENT, onAddIngredient);
    window.addEventListener(CANVAS_ADD_RECIPE_EVENT, onAddRecipe);
    return () => {
      window.removeEventListener(CANVAS_ADD_INGREDIENT_EVENT, onAddIngredient);
      window.removeEventListener(CANVAS_ADD_RECIPE_EVENT, onAddRecipe);
    };
  }, [stageIngredient, stageRecipe]);

  const updateIngredientRow = useCallback((id: string, update: (item: StagedIngredient) => StagedIngredient) => {
    setStagedIngredients((prev) => prev.map((item) => (item.id === id ? update(item) : item)));
  }, []);

  const onRecipeQuantityChange = useCallback(
    (id: string, quantity: number) => {
      setStagedRecipes((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
      // An existing sub-recipe link autosaves its quantity.
      if (!selectedRecipeId || !id.startsWith(EXISTING_RECIPE_PREFIX)) return;
      const linkId = parseInt(id.replace(EXISTING_RECIPE_PREFIX, ''), 10);
      clearTimeout(subRecipeUpdateTimers.current[id]);
      subRecipeUpdateTimers.current[id] = setTimeout(() => {
        updateSubRecipe.mutate({ recipeId: selectedRecipeId, linkId, data: { quantity } });
        delete subRecipeUpdateTimers.current[id];
      }, SUB_RECIPE_AUTOSAVE_MS);
    },
    [selectedRecipeId, updateSubRecipe]
  );

  const onIngredientSelect = useCallback((id: string, picked: Ingredient | Recipe) => {
    if (isRecipe(picked)) {
      // Ingredient row → sub-recipe, quantity 1, merged into an existing row of that recipe.
      setStagedIngredients((prev) => prev.filter((item) => item.id !== id));
      setStagedRecipes((prev) => {
        const existing = prev.find((item) => item.recipe.id === picked.id);
        if (existing) {
          return prev.map((item) => (item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item));
        }
        return [...prev, newStagedRecipe(picked, 1, id)];
      });
      return;
    }
    setStagedIngredients((prev) => {
      const current = prev.find((item) => item.id === id);
      if (!current) return prev;
      const duplicate = prev.find((item) => item.id !== id && item.ingredient.id === picked.id);
      if (duplicate) {
        return prev
          .map((item) => (item.id === duplicate.id ? { ...item, quantity: item.quantity + current.quantity } : item))
          .filter((item) => item.id !== id);
      }
      return prev.map((item) => (item.id === id ? { ...item, ingredient: picked, unit: picked.base_unit } : item));
    });
  }, []);

  const onRecipeSelect = useCallback(
    (id: string, picked: Recipe | Ingredient) => {
      if (!isRecipe(picked)) {
        // Sub-recipe row → ingredient, quantity 1, merged into an existing row of that ingredient.
        setStagedRecipes((prev) => prev.filter((item) => item.id !== id));
        setStagedIngredients((prev) => {
          const existing = prev.find((item) => item.ingredient.id === picked.id);
          if (existing) {
            return prev.map((item) => (item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item));
          }
          fetchSuppliersForIngredient(picked.id);
          return [...prev, newStagedIngredient(picked, 1, id)];
        });
        return;
      }
      setStagedRecipes((prev) => {
        const current = prev.find((item) => item.id === id);
        if (!current) return prev;
        const duplicate = prev.find((item) => item.id !== id && item.recipe.id === picked.id);
        if (duplicate) {
          return prev
            .map((item) => (item.id === duplicate.id ? { ...item, quantity: item.quantity + current.quantity } : item))
            .filter((item) => item.id !== id);
        }
        return prev.map((item) => (item.id === id ? { ...item, recipe: picked } : item));
      });
    },
    [fetchSuppliersForIngredient]
  );

  const actions: StagedItemActions = useMemo(
    () => ({
      onRemoveIngredient: (id) => setStagedIngredients((prev) => prev.filter((item) => item.id !== id)),
      onRemoveRecipe: (id) => setStagedRecipes((prev) => prev.filter((item) => item.id !== id)),
      onIngredientQuantityChange: (id, quantity) => updateIngredientRow(id, (item) => ({ ...item, quantity })),
      onIngredientWastageChange: (id, wastage_percentage) =>
        updateIngredientRow(id, (item) => ({ ...item, wastage_percentage })),
      onIngredientUnitChange: (id, newUnit) =>
        updateIngredientRow(id, (item) => {
          const converted = convertUnit(item.quantity, item.unit, newUnit);
          const convertedPrice = item.unitPrice != null ? convertUnitPrice(item.unitPrice, item.unit, newUnit) : null;
          return {
            ...item,
            unit: newUnit,
            quantity: converted != null ? parseFloat(converted.toPrecision(CONVERTED_QUANTITY_PRECISION)) : item.quantity,
            unitPrice: convertedPrice ?? item.unitPrice,
          };
        }),
      onSupplierSelect: (id, supplierId) =>
        updateIngredientRow(id, (item) => priceForSupplier(item, supplierId, supplierMap[item.ingredient.id] ?? [])),
      onRecipeQuantityChange,
      onIngredientSelect,
      onRecipeSelect,
    }),
    [updateIngredientRow, supplierMap, onRecipeQuantityChange, onIngredientSelect, onRecipeSelect]
  );

  return {
    stagedIngredients,
    stagedRecipes,
    setStagedIngredients,
    setStagedRecipes,
    supplierMap,
    fetchSuppliersForIngredient,
    stageIngredient,
    stageRecipe,
    actions,
  };
}
