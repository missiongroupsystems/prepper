'use client';

import { useCallback, useMemo } from 'react';
import {
  useAllRecipeRecipeCategories,
  useCategories,
  useIngredients,
  useRecipeCategories,
  useRecipeOutletsBatch,
  useRecipes,
} from '@/lib/hooks';
import type { Outlet } from '@/types';
import type { RecipeLabels } from './types';

const LOOKUP_PAGE_SIZE = 30;

interface OutletLink {
  is_active: boolean;
  outlet_id: number;
}

/** Recipes, ingredients and the name lookups the staged items show. */
export function useCanvasLookups(outlets: Outlet[] | undefined) {
  const { data: recipesData } = useRecipes({ page_size: LOOKUP_PAGE_SIZE });
  const recipes = recipesData?.items;
  const { data: ingredientsData } = useIngredients({ page_size: LOOKUP_PAGE_SIZE });
  const ingredients = ingredientsData?.items;
  const { data: categories } = useCategories();
  const { data: recipeCategoriesData } = useRecipeCategories({ page_size: LOOKUP_PAGE_SIZE });
  const recipeCategories = recipeCategoriesData?.items;
  const { data: recipeCategoryLinks } = useAllRecipeRecipeCategories();
  const { data: recipeOutlets = new Map() } = useRecipeOutletsBatch(
    recipes && recipes.length > 0 ? recipes.map((r) => r.id) : null
  );

  /** Ingredient category id → name. */
  const categoryMap = useMemo(() => {
    if (!categories) return {} as Record<number, string>;
    return categories.reduce<Record<number, string>>((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});
  }, [categories]);

  const recipeCategoryNameMap = useMemo(() => {
    if (!recipeCategories) return new Map<number, string>();
    return new Map(recipeCategories.map((c) => [c.id, c.name]));
  }, [recipeCategories]);

  /** recipe_id → its active recipe-category ids. */
  const recipeCategoryMap = useMemo(() => {
    const map = new Map<number, number[]>();
    if (!recipeCategoryLinks) return map;
    recipeCategoryLinks.forEach((link) => {
      if (link.is_active) map.set(link.recipe_id, [...(map.get(link.recipe_id) || []), link.category_id]);
    });
    return map;
  }, [recipeCategoryLinks]);

  const outletNameMap = useMemo(() => {
    if (!outlets) return new Map<number, string>();
    return new Map(outlets.map((o) => [o.id, o.name]));
  }, [outlets]);

  const getOutletNamesForRecipe = useCallback(
    (recipeId: number): string[] =>
      ((recipeOutlets.get(recipeId) || []) as OutletLink[])
        .filter((link) => link.is_active)
        .map((link) => outletNameMap.get(link.outlet_id))
        .filter((name): name is string => name !== undefined),
    [recipeOutlets, outletNameMap]
  );

  const getCategoryNamesForRecipe = useCallback(
    (recipeId: number): string[] =>
      (recipeCategoryMap.get(recipeId) || [])
        .map((catId) => recipeCategoryNameMap.get(catId))
        .filter((name): name is string => name !== undefined),
    [recipeCategoryMap, recipeCategoryNameMap]
  );

  const recipeLabels: RecipeLabels = useMemo(
    () => ({ getOutletNamesForRecipe, getCategoryNamesForRecipe }),
    [getOutletNamesForRecipe, getCategoryNamesForRecipe]
  );

  return { recipes, ingredients, categoryMap, recipeLabels };
}
