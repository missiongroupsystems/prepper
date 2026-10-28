'use client';

/**
 * Filter, sort, grouping and paging state for the ingredient list, plus the paginated tag pills
 * (loaded ten at a time and appended on "See more").
 */
import { useEffect, useState } from 'react';
import { useCategoriesPaginated, useDebouncedValue } from '@/lib/hooks';
import type { Category, Ingredient } from '@/types';

export type GroupByOption = 'none' | 'unit' | 'status' | 'category';
export type SortByOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';

export const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'No grouping' },
  { value: 'unit', label: 'By unit' },
  { value: 'status', label: 'By status' },
  { value: 'category', label: 'By tag' },
];

export const SORT_BY_OPTIONS = [
  { value: 'name_asc', label: 'A to Z' },
  { value: 'name_desc', label: 'Z to A' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

const SEARCH_DEBOUNCE_MS = 300;
const FILTER_TAGS_PAGE_SIZE = 10;
const ALL_INGREDIENTS = 'All ingredients';

export function useIngredientFilters() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [pageNumber, setPageNumber] = useState(1);
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [sortBy, setSortBy] = useState<SortByOption>('name_asc');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedHalal, setSelectedHalal] = useState<boolean[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<number[]>([]);

  // Any change to what is shown starts again from page one.
  useEffect(
    () => setPageNumber(1),
    [debouncedSearch, selectedCategories, selectedUnits, selectedHalal, selectedAllergens, showArchived, sortBy]
  );

  const [filterCatPage, setFilterCatPage] = useState(1);
  const [filterCategories, setFilterCategories] = useState<Category[]>([]);
  useEffect(() => setFilterCatPage(1), [debouncedSearch]);
  const { data: filterCatData, isFetching: filterCatFetching } = useCategoriesPaginated({
    page_size: FILTER_TAGS_PAGE_SIZE,
    page_number: filterCatPage,
    active_only: true,
    search: debouncedSearch || undefined,
  });
  useEffect(() => {
    if (!filterCatData?.items || filterCatFetching) return;
    if (filterCatData.page_number === 1) setFilterCategories(filterCatData.items);
    else setFilterCategories((prev) => [...prev, ...filterCatData.items]);
  }, [filterCatData, filterCatFetching]);

  const activeFilterCount =
    selectedCategories.length + selectedUnits.length + selectedHalal.length + selectedAllergens.length;

  const query = {
    active_only: !showArchived,
    page_number: pageNumber,
    search: debouncedSearch || undefined,
    category_ids: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
    units: selectedUnits.length > 0 ? selectedUnits.join(',') : undefined,
    allergen_ids: selectedAllergens.length > 0 ? selectedAllergens.join(',') : undefined,
    is_halal: selectedHalal.length > 0 ? selectedHalal.map(String).join(',') : undefined,
    sort_by: sortBy,
  };

  return {
    search,
    setSearch,
    debouncedSearch,
    setPageNumber,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
    showArchived,
    setShowArchived,
    selectedCategories,
    setSelectedCategories,
    selectedUnits,
    setSelectedUnits,
    selectedHalal,
    setSelectedHalal,
    selectedAllergens,
    setSelectedAllergens,
    activeFilterCount,
    isFiltered: Boolean(search) || activeFilterCount > 0,
    filterCategories,
    hasMoreFilterCategories: filterCatData ? filterCategories.length < filterCatData.total_count : false,
    loadMoreFilterCategories: () => setFilterCatPage((p) => p + 1),
    isLoadingMoreFilterCategories: filterCatFetching,
    query,
  };
}

function groupKey(ingredient: Ingredient, groupBy: GroupByOption, categoryNames: Map<number, string>): string {
  switch (groupBy) {
    case 'unit':
      return ingredient.base_unit || 'No unit';
    case 'status':
      return ingredient.is_active ? 'Active' : 'Archived';
    case 'category':
      return ingredient.category_id ? (categoryNames.get(ingredient.category_id) ?? 'Unknown') : 'Untagged';
    default:
      return ALL_INGREDIENTS;
  }
}

export function groupIngredients(
  ingredients: Ingredient[],
  groupBy: GroupByOption,
  categoryNames: Map<number, string>
): Record<string, Ingredient[]> {
  return ingredients.reduce<Record<string, Ingredient[]>>((groups, ingredient) => {
    const key = groupKey(ingredient, groupBy, categoryNames);
    (groups[key] ??= []).push(ingredient);
    return groups;
  }, {});
}
