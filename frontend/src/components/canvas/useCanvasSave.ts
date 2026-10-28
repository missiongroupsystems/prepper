'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setCanvasSaveHandler, useAppState } from '@/lib/store';
import {
  useAddRecipeIngredient,
  useAddSubRecipe,
  useCreateRecipe,
  useRemoveRecipeIngredient,
  useRemoveSubRecipe,
  useUpdateRecipe,
  useUpdateRecipeIngredient,
  useUpdateSubRecipe,
} from '@/lib/hooks';
import type { Recipe } from '@/types';
import { DEFAULT_METADATA, type StagedIngredient } from './types';
import type { useStagedItems } from './useStagedItems';
import type { useCanvasRecipe } from './useCanvasRecipe';
import { itemLabel } from './canvasModel';

type StagedItems = ReturnType<typeof useStagedItems>;
type CanvasRecipe = ReturnType<typeof useCanvasRecipe>;

function ingredientLinkData(staged: StagedIngredient) {
  return {
    quantity: staged.quantity,
    unit: staged.unit,
    base_unit: staged.unit,
    unit_price: staged.unitPrice ?? staged.ingredient.cost_per_base_unit ?? 0,
    supplier_id: staged.selectedSupplierId,
    wastage_percentage: staged.wastage_percentage,
  };
}

/**
 * Writes the canvas to the server. Saving creates the recipe (new) or reconciles it with the
 * server (existing): removes unstaged links, then updates or adds each staged one. Forking creates
 * a new version with everything staged and opens it.
 */
export function useCanvasSave(staged: StagedItems, canvas: CanvasRecipe, recipes: Recipe[] | undefined, canvasCost: number) {
  const router = useRouter();
  const { userId, userType } = useAppState();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const addIngredient = useAddRecipeIngredient();
  const updateIngredient = useUpdateRecipeIngredient();
  const removeIngredient = useRemoveRecipeIngredient();
  const addSubRecipe = useAddSubRecipe();
  const updateSubRecipe = useUpdateSubRecipe();
  const removeSubRecipe = useRemoveSubRecipe();
  const [isSaving, setIsSaving] = useState(false);
  const [isForking, setIsForking] = useState(false);

  const { stagedIngredients, stagedRecipes, setStagedIngredients, setStagedRecipes, supplierMap } = staged;
  const { selectedRecipeId, metadata, setMetadata, recipeIngredients, subRecipes, markSaved } = canvas;
  const selectedRecipe = selectedRecipeId ? recipes?.find((r) => r.id === selectedRecipeId) : undefined;

  const addStagedTo = useCallback(
    async (recipeId: number) => {
      for (const item of stagedIngredients) {
        await addIngredient.mutateAsync({ recipeId, data: { ingredient_id: item.ingredient.id, ...ingredientLinkData(item) } });
      }
      for (const item of stagedRecipes) {
        await addSubRecipe.mutateAsync({ recipeId, data: { child_recipe_id: item.recipe.id, quantity: item.quantity } });
      }
    },
    [stagedIngredients, stagedRecipes, addIngredient, addSubRecipe]
  );

  const updateExisting = useCallback(
    async (recipeId: number) => {
      const serverIngredients = recipeIngredients || [];
      const serverSubRecipes = subRecipes || [];
      await updateRecipe.mutateAsync({
        id: recipeId,
        data: {
          name: metadata.name,
          yield_quantity: metadata.yield_quantity,
          yield_unit: metadata.yield_unit,
          status: metadata.status,
          is_public: metadata.is_public,
          cost_price: canvasCost,
          selling_price_est: metadata.selling_price || null,
        },
      });

      const stagedIngredientIds = new Set(stagedIngredients.map((si) => si.ingredient.id));
      const stagedRecipeIds = new Set(stagedRecipes.map((sr) => sr.recipe.id));
      for (const ri of serverIngredients) {
        if (!stagedIngredientIds.has(ri.ingredient_id)) await removeIngredient.mutateAsync({ recipeId, ingredientId: ri.id });
      }
      for (const sr of serverSubRecipes) {
        if (!stagedRecipeIds.has(sr.child_recipe_id)) await removeSubRecipe.mutateAsync({ recipeId, linkId: sr.id });
      }

      const serverIngredientMap = new Map(serverIngredients.map((ri) => [ri.ingredient_id, ri]));
      for (const item of stagedIngredients) {
        const existing = serverIngredientMap.get(item.ingredient.id);
        if (existing) {
          await updateIngredient.mutateAsync({ recipeId, ingredientId: existing.id, data: ingredientLinkData(item) });
        } else {
          await addIngredient.mutateAsync({ recipeId, data: { ingredient_id: item.ingredient.id, ...ingredientLinkData(item) } });
        }
      }
      const serverSubRecipeMap = new Map(serverSubRecipes.map((sr) => [sr.child_recipe_id, sr]));
      for (const item of stagedRecipes) {
        const existing = serverSubRecipeMap.get(item.recipe.id);
        if (existing) {
          await updateSubRecipe.mutateAsync({ recipeId, linkId: existing.id, data: { quantity: item.quantity } });
        } else {
          await addSubRecipe.mutateAsync({ recipeId, data: { child_recipe_id: item.recipe.id, quantity: item.quantity } });
        }
      }
    },
    [
      recipeIngredients,
      subRecipes,
      metadata,
      canvasCost,
      stagedIngredients,
      stagedRecipes,
      updateRecipe,
      removeIngredient,
      removeSubRecipe,
      updateIngredient,
      addIngredient,
      updateSubRecipe,
      addSubRecipe,
    ]
  );

  /** Saves without checks — also what the "Save & leave" prompt runs. */
  const persist = useCallback(async () => {
    setIsSaving(true);
    try {
      if (selectedRecipeId) {
        await updateExisting(selectedRecipeId);
        markSaved();
        toast.success('Recipe updated');
        return;
      }
      const newRecipe = await createRecipe.mutateAsync({
        name: metadata.name,
        yield_quantity: metadata.yield_quantity,
        yield_unit: metadata.yield_unit,
        cost_price: canvasCost,
        selling_price_est: metadata.selling_price || null,
        status: metadata.status,
        created_by: userId || undefined,
        is_public: metadata.is_public,
        owner_id: userId || undefined,
        version: 1,
        root_id: null,
      });
      await addStagedTo(newRecipe.id);
      toast.success('Recipe created');
      // The new recipe's page loads its own state; this canvas unmounts on navigation.
      router.push(`/recipes/${newRecipe.id}`);
    } catch {
      toast.error(selectedRecipeId ? 'Failed to update recipe' : 'Failed to create recipe');
    } finally {
      setIsSaving(false);
    }
  }, [selectedRecipeId, updateExisting, markSaved, createRecipe, metadata, canvasCost, userId, addStagedTo, router]);

  /** Saves, refusing to publish (status active) while an ingredient has no supplier. */
  const save = useCallback(() => {
    if (metadata.status === 'active') {
      const withoutSupplier = stagedIngredients.filter((si) => !(supplierMap[si.ingredient.id]?.length > 0));
      if (withoutSupplier.length > 0) {
        const names = withoutSupplier.map((si) => itemLabel(si.ingredient.name)).join(', ');
        toast.error(`Cannot publish: the following ingredients have no supplier — ${names}`);
        return;
      }
    }
    void persist();
  }, [metadata.status, stagedIngredients, supplierMap, persist]);

  // The "Save & leave" prompt on tab switch calls the latest persist.
  const persistRef = useRef(persist);
  persistRef.current = persist;
  useEffect(() => {
    setCanvasSaveHandler(() => persistRef.current());
    return () => setCanvasSaveHandler(null);
  }, []);

  /** Creates the next version (`root_id` = this recipe) with everything staged, then opens it. */
  const fork = useCallback(async () => {
    if (!selectedRecipe) {
      toast.error('No recipe selected to fork');
      return;
    }
    setIsForking(true);
    const version = selectedRecipe.version + 1;
    try {
      const newRecipe = await createRecipe.mutateAsync({
        name: `${metadata.name} (Fork)`,
        yield_quantity: metadata.yield_quantity,
        yield_unit: metadata.yield_unit,
        selling_price_est: metadata.selling_price || null,
        status: metadata.status,
        created_by: userId || undefined,
        is_public: metadata.is_public,
        owner_id: userId || undefined,
        version,
        root_id: selectedRecipe.id,
      });
      await addStagedTo(newRecipe.id);
      setStagedIngredients([]);
      setStagedRecipes([]);
      setMetadata(DEFAULT_METADATA);
      toast.success(`Recipe forked. Version ${version} created.`);
      router.push(`/recipes/${newRecipe.id}`);
    } catch {
      toast.error('Failed to fork recipe');
    } finally {
      setIsForking(false);
    }
  }, [selectedRecipe, createRecipe, metadata, userId, addStagedTo, setStagedIngredients, setStagedRecipes, setMetadata, router]);

  // Admins can save any recipe; a new recipe belongs to whoever creates it.
  const isOwner = userType === 'admin' || !selectedRecipeId || selectedRecipe?.owner_id === userId;
  const rootRecipeName = selectedRecipe?.root_id
    ? (recipes?.find((r) => r.id === selectedRecipe.root_id)?.name ?? null)
    : null;

  return {
    save,
    fork,
    isSaving,
    isForking,
    isOwner,
    rootRecipeName,
    currentVersion: selectedRecipe?.version ?? null,
  };
}
