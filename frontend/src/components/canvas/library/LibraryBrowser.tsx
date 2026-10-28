'use client';

/**
 * The library's body: All / Ingredients / Items, search, a category filter, and the paged lists.
 * A search that finds no ingredient offers to create it. Double-click empty space for the form.
 */
import { useState } from 'react';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import { Button, SearchInput, SegmentedControl } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Outlet } from '@/types';
import { DraggableIngredientCard, DraggableRecipeCard, LibrarySkeleton } from './LibraryItemCards';
import { NewIngredientForm } from './NewIngredientForm';
import { useLibraryData } from './useLibraryData';

type LibraryTab = 'all' | 'ingredients' | 'items';

const TABS: { id: LibraryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'items', label: 'Items' },
];

function LoadMore({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={loading} className="mt-1 w-full">
      {loading && <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />}
      {loading ? 'Loading…' : 'Load more'}
    </Button>
  );
}

export function LibraryBrowser({
  outlets,
  showForm,
  onShowForm,
  onCloseForm,
}: {
  outlets?: Outlet[];
  showForm: boolean;
  onShowForm: () => void;
  onCloseForm: () => void;
}) {
  const data = useLibraryData(outlets);
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const { search, isQuickAdding, ingredients, recipes, selectedCategories } = data;
  const showIngredients = activeTab === 'all' || activeTab === 'ingredients';
  const showRecipes = activeTab === 'all' || activeTab === 'items';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn('space-y-2 border-b border-border px-3 py-3', isQuickAdding && 'pointer-events-none opacity-50')}>
        <SegmentedControl
          items={TABS}
          activeId={activeTab}
          label="Library sections"
          onSelect={(id) => setActiveTab(id as LibraryTab)}
        />
        <SearchInput
          value={search}
          onChange={(e) => data.setSearch(e.target.value)}
          onClear={() => data.setSearch('')}
          placeholder="Search the library"
          aria-label="Search the library"
        />
      </div>

      {showIngredients && data.displayedCategories.length > 0 && (
        <div className="border-b border-border">
          <button
            type="button"
            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
            aria-expanded={showCategoryFilter}
            className="flex min-h-10 w-full items-center justify-between px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover pointer-coarse:min-h-11"
          >
            <span>Filter{selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ''}</span>
            <ChevronDown
              className={cn('size-4 transition-transform', showCategoryFilter && 'rotate-180')}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
          {showCategoryFilter && (
            <div className="px-3 pb-3">
              <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                {data.displayedCategories.map((category) => {
                  const selected = selectedCategories.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => data.toggleCategory(category.id)}
                      aria-pressed={selected}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                        selected ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-surface-hover'
                      )}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {data.hasMoreCategories && (
                  <Button variant="ghost" size="sm" onClick={data.loadMoreCategories} disabled={data.catFetching}>
                    {data.catFetching ? 'Loading…' : 'See more'}
                  </Button>
                )}
                {selectedCategories.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={data.clearCategories}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className={cn('relative min-h-0 flex-1 overflow-y-auto px-3 py-3', isQuickAdding && 'pointer-events-none')}
        onDoubleClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('[data-ingredient-card]') && !target.closest('[data-recipe-card]')) onShowForm();
        }}
      >
        {isQuickAdding && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/70">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
              Creating ingredient…
            </span>
          </div>
        )}
        {showForm && (
          <div className="mb-3">
            <NewIngredientForm onClose={onCloseForm} />
          </div>
        )}

        {data.isLoading ? (
          <LibrarySkeleton />
        ) : data.hasError ? (
          <p className="rounded-lg bg-danger-subtle p-3 text-center text-sm text-danger">Failed to load items</p>
        ) : (
          <div className="space-y-4">
            {showIngredients && (
              <section aria-label="Ingredients">
                {activeTab === 'all' && <h3 className="eyebrow mb-2 px-1">Ingredients</h3>}
                {ingredients.length === 0 ? (
                  <div className="px-1">
                    {search.trim() ? (
                      <>
                        <button
                          type="button"
                          onClick={data.quickAdd}
                          disabled={isQuickAdding}
                          className="mb-2 flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed border-input px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover disabled:opacity-50"
                        >
                          <Plus className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                          <span className="truncate">Add &ldquo;{search.trim()}&rdquo;</span>
                        </button>
                        <p className="text-sm text-tertiary">No matching ingredients</p>
                      </>
                    ) : (
                      <p className="text-sm text-tertiary">No ingredients yet</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {ingredients.map((ingredient) => (
                      <DraggableIngredientCard key={ingredient.id} ingredient={ingredient} categoryMap={data.categoryMap} />
                    ))}
                    {data.ingredientsQuery.hasNextPage && (
                      <LoadMore
                        onClick={() => data.ingredientsQuery.fetchNextPage()}
                        loading={data.ingredientsQuery.isFetchingNextPage}
                      />
                    )}
                  </div>
                )}
              </section>
            )}

            {showRecipes && (
              <section aria-label="Items">
                {activeTab === 'all' && <h3 className="eyebrow mb-2 px-1">Items</h3>}
                {recipes.length === 0 ? (
                  <p className="px-1 text-sm text-tertiary">{search ? 'No matches' : 'No dishes yet'}</p>
                ) : (
                  <div className="space-y-1.5">
                    {recipes.map((recipe) => (
                      <DraggableRecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        outletNames={data.getOutletNamesForRecipe(recipe.id)}
                        categoryNames={data.getCategoryNamesForRecipe(recipe.id)}
                      />
                    ))}
                    {data.recipesQuery.hasNextPage && (
                      <LoadMore
                        onClick={() => data.recipesQuery.fetchNextPage()}
                        loading={data.recipesQuery.isFetchingNextPage}
                      />
                    )}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'all' && ingredients.length === 0 && recipes.length === 0 && !search && (
              <p className="py-8 text-center text-sm text-tertiary">No items yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
