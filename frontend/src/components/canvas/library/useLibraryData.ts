'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useAllRecipeRecipeCategories,
  useCategoriesPaginated,
  useCategorizeIngredient,
  useCreateIngredient,
  useDebouncedValue,
  useInfiniteIngredients,
  useInfiniteRecipes,
  useRecipeCategories,
  useRecipeOutletsBatch,
} from '@/lib/hooks';
import type { Category, Outlet } from '@/types';

const LIBRARY_PAGE_SIZE = 30;
const CATEGORY_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * The library's data: searchable, paged ingredients and recipes, a paged category filter, and
 * quick-add of a searched name as a new ingredient.
 */
export function useLibraryData(outlets: Outlet[] | undefined) {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [catPage, setCatPage] = useState(1);
  const [displayedCategories, setDisplayedCategories] = useState<Category[]>([]);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const ingredientParams = useMemo(
    () => ({
      page_size: LIBRARY_PAGE_SIZE,
      active_only: true,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(selectedCategories.length > 0 ? { category_ids: selectedCategories.join(',') } : {}),
    }),
    [debouncedSearch, selectedCategories]
  );
  const recipeParams = useMemo(
    () => ({ page_size: LIBRARY_PAGE_SIZE, ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}) }),
    [debouncedSearch]
  );

  const ingredientsQuery = useInfiniteIngredients(ingredientParams);
  const recipesQuery = useInfiniteRecipes(recipeParams);
  const ingredients = ingredientsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const recipes = recipesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const { data: catPageData, isFetching: catFetching } = useCategoriesPaginated({
    page_size: CATEGORY_PAGE_SIZE,
    page_number: catPage,
    active_only: true,
  });
  useEffect(() => {
    if (!catPageData?.items || catFetching) return;
    setDisplayedCategories((prev) => (catPageData.page_number === 1 ? catPageData.items : [...prev, ...catPageData.items]));
  }, [catPageData, catFetching]);
  const hasMoreCategories = catPageData ? displayedCategories.length < catPageData.total_count : false;

  const { data: recipeCategoriesData } = useRecipeCategories({ page_size: LIBRARY_PAGE_SIZE });
  const { data: allRecipeRecipeCategories } = useAllRecipeRecipeCategories();
  const { data: recipeOutlets = new Map() } = useRecipeOutletsBatch(recipes.length > 0 ? recipes.map((r) => r.id) : null);

  const categoryMap = useMemo(
    () =>
      displayedCategories.reduce<Record<number, string>>((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {}),
    [displayedCategories]
  );
  const recipeCategoryMap = useMemo(
    () =>
      (recipeCategoriesData?.items ?? []).reduce<Record<number, string>>((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {}),
    [recipeCategoriesData]
  );
  const outletNameMap = useMemo(
    () =>
      (outlets ?? []).reduce<Record<number, string>>((acc, outlet) => {
        acc[outlet.id] = outlet.name;
        return acc;
      }, {}),
    [outlets]
  );

  const getOutletNamesForRecipe = (recipeId: number): string[] =>
    ((recipeOutlets.get(recipeId) || []) as { outlet_id: number }[])
      .map((ro) => outletNameMap[ro.outlet_id])
      .filter(Boolean);
  const getCategoryNamesForRecipe = (recipeId: number): string[] =>
    (allRecipeRecipeCategories || [])
      .filter((link) => link.recipe_id === recipeId)
      .map((link) => recipeCategoryMap[link.category_id])
      .filter(Boolean);

  const toggleCategory = (categoryId: number) =>
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );

  const createIngredient = useCreateIngredient();
  const categorizeIngredient = useCategorizeIngredient();
  /** Creates the searched name as an ingredient (g, no cost); a failed categorisation is skipped. */
  const quickAdd = useCallback(async () => {
    const name = search.trim();
    if (!name) return;
    setIsQuickAdding(true);
    try {
      let categoryId: number | null = null;
      try {
        categoryId = (await categorizeIngredient.mutateAsync(name)).category_id;
      } catch {
        // Categorisation is best-effort; the ingredient is created without a category.
      }
      await createIngredient.mutateAsync({ name, base_unit: 'g', cost_per_base_unit: null, category_id: categoryId });
      toast.success(`Ingredient "${name}" created`);
      setSearch('');
    } catch {
      toast.error('Failed to create ingredient');
    } finally {
      setIsQuickAdding(false);
    }
  }, [search, categorizeIngredient, createIngredient]);

  return {
    search,
    setSearch,
    ingredients,
    recipes,
    ingredientsQuery,
    recipesQuery,
    isLoading: ingredientsQuery.isLoading || recipesQuery.isLoading,
    hasError: !!(ingredientsQuery.error || recipesQuery.error),
    displayedCategories,
    selectedCategories,
    toggleCategory,
    clearCategories: () => setSelectedCategories([]),
    hasMoreCategories,
    loadMoreCategories: () => setCatPage((p) => p + 1),
    catFetching,
    categoryMap,
    getOutletNamesForRecipe,
    getCategoryNamesForRecipe,
    quickAdd,
    isQuickAdding,
  };
}
