/** Sorting and grouping for the dishes list. Filtering happens on the server. */
import type { Recipe, RecipeStatus } from '@/types';

export type GroupByOption = 'none' | 'status' | 'category';
export type StatusFilter = 'all' | RecipeStatus;
export type SortByOption = 'price_asc' | 'price_desc';

export const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'No grouping' },
  { value: 'status', label: 'By status' },
  { value: 'category', label: 'By category' },
];

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Active and draft' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export const SORT_BY_OPTIONS = [
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export function sortRecipes(recipes: Recipe[], sortBy: SortByOption): Recipe[] {
  const withCost: Recipe[] = [];
  const noCost: Recipe[] = [];

  recipes.forEach((recipe) => {
    if (recipe.cost_price !== null && recipe.cost_price !== undefined) {
      withCost.push(recipe);
    } else {
      noCost.push(recipe);
    }
  });

  if (sortBy === 'price_asc') {
    withCost.sort((a, b) => (a.cost_price ?? 0) - (b.cost_price ?? 0));
  } else if (sortBy === 'price_desc') {
    withCost.sort((a, b) => (b.cost_price ?? 0) - (a.cost_price ?? 0));
  }

  return [...withCost, ...noCost];
}

export function groupRecipes(
  recipes: Recipe[],
  groupBy: GroupByOption,
  recipeCategoryMap: Map<number, number[]>,
  categoryNameMap: Map<number, string>
): Record<string, Recipe[]> {
  if (groupBy === 'none') {
    return { 'All dishes': recipes };
  }

  if (groupBy === 'status') {
    const grouped: Record<string, Recipe[]> = {
      'Active': [],
      'Draft': [],
      'Archived': [],
    };

    recipes.forEach((recipe) => {
      const key = recipe.status.charAt(0).toUpperCase() + recipe.status.slice(1);
      if (grouped[key]) {
        grouped[key].push(recipe);
      }
    });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(grouped).filter(([, items]) => items.length > 0)
    );
  }

  if (groupBy === 'category') {
    const grouped: Record<string, Recipe[]> = {};

    recipes.forEach((recipe) => {
      const categoryIds = recipeCategoryMap.get(recipe.id) || [];

      if (categoryIds.length === 0) {
        // Recipe has no categories
        if (!grouped['Uncategorized']) {
          grouped['Uncategorized'] = [];
        }
        grouped['Uncategorized'].push(recipe);
      } else {
        // Add recipe to each of its category groups
        categoryIds.forEach((categoryId) => {
          const categoryName = categoryNameMap.get(categoryId) || 'Unknown';
          if (!grouped[categoryName]) {
            grouped[categoryName] = [];
          }
          grouped[categoryName].push(recipe);
        });
      }
    });

    return grouped;
  }

  return { 'All dishes': recipes };
}
