'use client';

/**
 * Dishes — the dish library: search, sort, status and grouping in a wrapping toolbar, category
 * pills, then the grouped cards or rows. Outlets, allergens and sub-dish matches for the page
 * are fetched in batches, never per card.
 */
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus } from 'lucide-react';
import { useRecipes, useRecipeCategories, useAllRecipeRecipeCategories, useOutlets, useRecipeOutletsBatch, useRecipeAllergensBatch, useSubRecipesBatch, useDebouncedValue } from '@/lib/hooks';
import { Button, EmptyState, Pagination, SearchInput, Select, ViewToggle } from '@/components/ui';
import { CardGrid, ListError, ListGroup, ListSkeleton, ListStack, ListToolbar, TabHeader } from '@/components/lists/ListLayout';
import type { ListView } from '@/components/lists/ReferenceListView';
import { formatDisplayName } from '@/lib/format/displayName';
import { useAppState } from '@/lib/store';
import type { Recipe, Allergen } from '@/types';
import { RecipeCard } from './RecipeCard';
import { RecipeListRow } from './RecipeListRow';
import { RecipeCategoryFilterButtons } from './RecipeCategoryFilterButtons';
import {
  GROUP_BY_OPTIONS,
  SORT_BY_OPTIONS,
  STATUS_FILTER_OPTIONS,
  groupRecipes,
  sortRecipes,
  type GroupByOption,
  type SortByOption,
  type StatusFilter,
} from './recipeListModel';

const PAGE_SIZE = 30;
const LOOKUP_PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;

export function RecipeManagementTab() {
  const router = useRouter();
  const { userId, selectRecipe } = useAppState();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [pageNumber, setPageNumber] = useState(1);
  const [groupBy, setGroupBy] = useState<GroupByOption>('status');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [view, setView] = useState<ListView>('grid');
  const [sortBy, setSortBy] = useState<SortByOption>('price_asc');
  const [selectedRecipeCategories, setSelectedRecipeCategories] = useState<number[]>([]);

  // Reset page when search or filters change
  useEffect(() => setPageNumber(1), [debouncedSearch, statusFilter, selectedRecipeCategories]);

  const { data: recipesData, isLoading, error } = useRecipes({
    page_size: PAGE_SIZE,
    page_number: pageNumber,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category_ids: selectedRecipeCategories.length > 0 ? selectedRecipeCategories.join(',') : undefined,
  });
  const recipes = useMemo(
    () => (Array.isArray(recipesData?.items) ? recipesData.items : Array.isArray(recipesData) ? recipesData : []),
    [recipesData]
  );
  const { data: recipeCategoriesData } = useRecipeCategories({ page_size: LOOKUP_PAGE_SIZE });
  const recipeCategories = useMemo(
    () =>
      Array.isArray(recipeCategoriesData?.items)
        ? recipeCategoriesData.items
        : Array.isArray(recipeCategoriesData)
          ? recipeCategoriesData
          : [],
    [recipeCategoriesData]
  );
  const { data: recipeCategoryLinks } = useAllRecipeRecipeCategories();
  const { data: outletsData } = useOutlets({ page_size: LOOKUP_PAGE_SIZE });
  const outlets = useMemo(() => outletsData?.items ?? [], [outletsData]);

  // Memoize recipe IDs to prevent unstable references triggering refetches
  const recipeIds = useMemo(
    () => (recipes.length > 0 ? recipes.map((r) => r.id) : null),
    [recipes]
  );

  // Fetch outlets for all recipes (with TanStack Query caching)
  const { data: recipeOutlets = new Map() } = useRecipeOutletsBatch(recipeIds);

  // Fetch allergens for all recipes (with TanStack Query caching)
  const { data: recipeAllergens = new Map() } = useRecipeAllergensBatch(recipeIds);

  // Fetch sub-dish presence for all recipes (with TanStack Query caching)
  const { data: recipeSubDishMap = {} } = useSubRecipesBatch(recipeIds);
  // Only flag a dish as "matched via sub-dish" when a search is active and
  // the dish name doesn't directly match (meaning it was surfaced via a sub-dish).
  const matchedViaSubDish = (recipe: Recipe): boolean => {
    if (!debouncedSearch) return false;
    if (!recipeSubDishMap[recipe.id]) return false;
    return !recipe.name.toLowerCase().includes(debouncedSearch.toLowerCase());
  };

  // Build a map of recipe_id -> category_ids[] for efficient filtering
  const recipeCategoryMap = useMemo(() => {
    const map = new Map<number, number[]>();

    if (!recipeCategoryLinks) return map;

    recipeCategoryLinks.forEach((link) => {
      if (link.is_active) {
        const existing = map.get(link.recipe_id) || [];
        map.set(link.recipe_id, [...existing, link.category_id]);
      }
    });

    return map;
  }, [recipeCategoryLinks]);

  // Map category_id -> name (for grouping)
  const categoryNameMap = useMemo(() => {
    return new Map(recipeCategories.map((c) => [c.id, formatDisplayName(c.name)]));
  }, [recipeCategories]);

  // Map outlet_id -> name
  const outletNameMap = useMemo(() => {
    return new Map(outlets.map((o) => [o.id, o.name]));
  }, [outlets]);

  // Get outlet names for a recipe
  const getOutletNamesForRecipe = (recipeId: number): string[] => {
    const recipeOutletLinks = recipeOutlets.get(recipeId) || [];
    return recipeOutletLinks
      .filter((link: { is_active: boolean; outlet_id: number }) => link.is_active)
      .map((link: { is_active: boolean; outlet_id: number }) => outletNameMap.get(link.outlet_id))
      .filter((name: string | undefined): name is string => name !== undefined);
  };

  // Get category names for a recipe
  const getCategoryNamesForRecipe = (recipeId: number): string[] => {
    const categoryIds = recipeCategoryMap.get(recipeId) || [];
    return categoryIds
      .map((catId) => categoryNameMap.get(catId))
      .filter((name): name is string => name !== undefined);
  };

  // Get allergen names for a recipe
  const getAllergenNamesForRecipe = (recipeId: number): string[] => {
    const allergens = recipeAllergens.get(recipeId) || [];
    return allergens.map((allergen: Allergen) => allergen.name);
  };

  // Sort recipes (filtering is now server-side)
  const filteredRecipes = useMemo(() => {
    return sortRecipes(recipes, sortBy);
  }, [recipes, sortBy]);

  const handleCreate = () => {
    // Clear selected recipe and navigate to canvas for new recipe creation
    selectRecipe(null);
    router.push('/recipes/new');
  };

  const groupedRecipes = useMemo(() => {
    return groupRecipes(filteredRecipes, groupBy, recipeCategoryMap, categoryNameMap);
  }, [filteredRecipes, groupBy, recipeCategoryMap, categoryNameMap]);

  const isFiltered = Boolean(search) || statusFilter !== 'all' || selectedRecipeCategories.length > 0;

  const newDishButton = (
    <Button onClick={handleCreate}>
      <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      New dish
    </Button>
  );

  const renderItems = (items: Recipe[]) =>
    view === 'grid' ? (
      <CardGrid>
        {items.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isOwned={userId !== null && recipe.owner_id === userId}
            outletNames={getOutletNamesForRecipe(recipe.id)}
            categoryNames={getCategoryNamesForRecipe(recipe.id)}
            allergenNames={getAllergenNamesForRecipe(recipe.id)}
            matchedViaSubDish={matchedViaSubDish(recipe)}
          />
        ))}
      </CardGrid>
    ) : (
      <ListStack>
        {items.map((recipe) => (
          <RecipeListRow
            key={recipe.id}
            recipe={recipe}
            isOwned={userId !== null && recipe.owner_id === userId}
            categoryNames={getCategoryNamesForRecipe(recipe.id)}
            allergenNames={getAllergenNamesForRecipe(recipe.id)}
            matchedViaSubDish={matchedViaSubDish(recipe)}
          />
        ))}
      </ListStack>
    );

  const body = () => {
    if (error) return <ListError>Failed to load dishes. Please try again.</ListError>;
    if (isLoading) return <ListSkeleton view={view} />;
    if (filteredRecipes.length === 0) {
      return isFiltered ? (
        <EmptyState icon={BookOpen} title="No dishes match your filters" description="Try a different search or clear a filter." />
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No dishes yet"
          description="Start one on the canvas: drag in ingredients and it costs itself."
          action={newDishButton}
        />
      );
    }
    if (groupBy === 'none') return renderItems(filteredRecipes);
    return (
      <div className="flex flex-col gap-8">
        {Object.entries(groupedRecipes).map(([group, items]) => (
          <ListGroup key={group} title={group} count={items.length}>
            {renderItems(items)}
          </ListGroup>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <TabHeader
        title="Dishes"
        description="Every dish and prep recipe, with its cost per portion. Deleted dishes are under the Archived status."
        actions={newDishButton}
      />

      <div className="flex flex-col gap-3">
        <ListToolbar
          search={
            <SearchInput
              placeholder="Search dishes"
              aria-label="Search dishes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
            />
          }
        >
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Select
              aria-label="Sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortByOption)}
              options={SORT_BY_OPTIONS}
              className="col-span-2 sm:w-44"
            />
            <Select
              aria-label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              options={STATUS_FILTER_OPTIONS}
              className="min-w-0 sm:w-36"
            />
            <Select
              aria-label="Group"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
              options={GROUP_BY_OPTIONS}
              className="min-w-0 sm:w-36"
            />
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </ListToolbar>
        <RecipeCategoryFilterButtons
          categories={recipeCategories}
          selectedCategories={selectedRecipeCategories}
          onCategoryChange={setSelectedRecipeCategories}
        />
      </div>

      {body()}

      {recipesData && (
        <Pagination
          pageNumber={recipesData.page_number}
          totalPages={recipesData.total_pages}
          totalCount={recipesData.total_count}
          currentPageSize={recipesData.current_page_size}
          onPageChange={setPageNumber}
        />
      )}
    </div>
  );
}
