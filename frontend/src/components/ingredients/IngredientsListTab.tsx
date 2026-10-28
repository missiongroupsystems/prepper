'use client';

/**
 * Ingredients → Ingredients: the ingredient library. A wrapping toolbar (search, sort, group,
 * archived, view), the tag / unit / halal / allergen pills — folded behind a Filters button on a
 * phone — then the grouped cards or rows and pagination.
 */
import { useMemo, useState } from 'react';
import { Carrot, Plus, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useIngredients, useDeactivateIngredient, useUpdateIngredient, useCategories, useAllergens } from '@/lib/hooks';
import { Button, Checkbox, EmptyState, Pagination, SearchInput, Select, ViewToggle } from '@/components/ui';
import { ImportMenu } from '@/components/lists/ImportMenu';
import { CardGrid, ListError, ListGroup, ListSkeleton, ListStack, ListToolbar, TabHeader } from '@/components/lists/ListLayout';
import type { ListView } from '@/components/lists/ReferenceListView';
import { downloadFMHSampleItems, downloadBuyCatalogueTemplate } from '@/lib/api';
import { triggerBlobDownload } from '@/lib/utils';
import { displayNameParts, formatDisplayName } from '@/lib/format/displayName';
import type { Ingredient } from '@/types';
import { AddIngredientModal } from './AddIngredientModal';
import { BuyCatalogueImportModal } from './BuyCatalogueImportModal';
import { FilterButtons } from './FilterButtons';
import { FMHIngredientImportModal } from './FMHIngredientImportModal';
import { IngredientCard, IngredientListRow } from './IngredientCard';
import {
  GROUP_BY_OPTIONS,
  SORT_BY_OPTIONS,
  groupIngredients,
  useIngredientFilters,
  type GroupByOption,
  type SortByOption,
} from './useIngredientFilters';

const PAGE_SIZE = 30;
const PILLS_ID = 'ingredient-filter-pills';

type Download = 'items' | 'template';

export function IngredientsListTab() {
  const deactivateIngredient = useDeactivateIngredient();
  const updateIngredient = useUpdateIngredient();
  const filters = useIngredientFilters();

  const [showForm, setShowForm] = useState(false);
  const [showFMHImport, setShowFMHImport] = useState(false);
  const [showBuyCatalogueImport, setShowBuyCatalogueImport] = useState(false);
  const [downloading, setDownloading] = useState<Download | null>(null);
  const [view, setView] = useState<ListView>('grid');
  const [pillsOpen, setPillsOpen] = useState(false);

  const { data, isLoading, error } = useIngredients({ ...filters.query, page_size: PAGE_SIZE });
  const ingredients = useMemo(() => data?.items ?? [], [data]);
  const { data: categories } = useCategories();
  const { data: allergens } = useAllergens();

  const categoryNames = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, formatDisplayName(c.name)])),
    [categories]
  );
  const groups = useMemo(
    () => groupIngredients(ingredients, filters.groupBy, categoryNames),
    [ingredients, filters.groupBy, categoryNames]
  );

  const download = async (kind: Download) => {
    setDownloading(kind);
    try {
      if (kind === 'items') triggerBlobDownload(await downloadFMHSampleItems(), 'ProductList_sample.xlsx');
      else triggerBlobDownload(await downloadBuyCatalogueTemplate(), 'BuyCatalogue_template.xlsx');
    } catch {
      toast.error(kind === 'items' ? 'Failed to download sample product list file' : 'Failed to download Buy Catalogue template');
    } finally {
      setDownloading(null);
    }
  };

  const handleArchive = (ingredient: Ingredient) => {
    const { name } = displayNameParts(ingredient.name);
    deactivateIngredient.mutate(ingredient.id, {
      onSuccess: () => toast.success(`${name} archived`),
      onError: () => toast.error(`Failed to archive ${name}`),
    });
  };

  const handleUnarchive = (ingredient: Ingredient) => {
    const { name } = displayNameParts(ingredient.name);
    updateIngredient.mutate(
      { id: ingredient.id, data: { is_active: true } },
      {
        onSuccess: () => toast.success(`${name} unarchived`),
        onError: () => toast.error(`Failed to unarchive ${name}`),
      }
    );
  };

  const addButton = (
    <Button type="button" onClick={() => setShowForm(true)}>
      <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      Add ingredient
    </Button>
  );

  const renderItems = (items: Ingredient[]) => {
    const Item = view === 'grid' ? IngredientCard : IngredientListRow;
    const rendered = items.map((ingredient) => (
      <Item
        key={ingredient.id}
        ingredient={ingredient}
        categories={categories}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
      />
    ));
    return view === 'grid' ? <CardGrid>{rendered}</CardGrid> : <ListStack>{rendered}</ListStack>;
  };

  const body = () => {
    if (error) return <ListError>Failed to load ingredients. Please try again.</ListError>;
    if (isLoading) return <ListSkeleton view={view} />;
    if (ingredients.length === 0) {
      return filters.isFiltered ? (
        <EmptyState icon={Carrot} title="No ingredients match your filters" description="Try a different search or clear a filter." />
      ) : (
        <EmptyState icon={Carrot} title="No ingredients yet" description="Add one, or import your FMH product list." action={addButton} />
      );
    }
    if (filters.groupBy === 'none') return renderItems(ingredients);
    return (
      <div className="flex flex-col gap-8">
        {Object.entries(groups).map(([group, items]) => (
          <ListGroup key={group} title={group} count={items.length}>
            {renderItems(items)}
          </ListGroup>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <AddIngredientModal isOpen={showForm} onClose={() => setShowForm(false)} />
      <FMHIngredientImportModal isOpen={showFMHImport} onClose={() => setShowFMHImport(false)} />
      <BuyCatalogueImportModal isOpen={showBuyCatalogueImport} onClose={() => setShowBuyCatalogueImport(false)} />

      <TabHeader
        title="Ingredients"
        description="Your ingredient library, priced per base unit."
        actions={
          <>
            <ImportMenu
              groups={[
                [
                  { kind: 'import', label: 'Import FMH product list', onSelect: () => setShowFMHImport(true) },
                  {
                    kind: 'download',
                    label: downloading === 'items' ? 'Downloading…' : 'Export FMH product list',
                    onSelect: () => download('items'),
                    disabled: downloading !== null,
                  },
                ],
                [
                  { kind: 'import', label: 'Import Buy Catalogue', onSelect: () => setShowBuyCatalogueImport(true) },
                  {
                    kind: 'download',
                    label: downloading === 'template' ? 'Downloading…' : 'Download Buy Catalogue template',
                    onSelect: () => download('template'),
                    disabled: downloading !== null,
                  },
                ],
              ]}
            />
            {addButton}
          </>
        }
      />

      <ListToolbar
        search={
          <SearchInput
            placeholder="Search ingredients"
            aria-label="Search ingredients"
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            onClear={() => filters.setSearch('')}
          />
        }
      >
        <div className="flex w-full gap-2 sm:w-auto">
          <Select
            aria-label="Sort"
            value={filters.sortBy}
            onChange={(e) => filters.setSortBy(e.target.value as SortByOption)}
            options={SORT_BY_OPTIONS}
            className="min-w-0 flex-1 sm:w-44 sm:flex-none"
          />
          <Select
            aria-label="Group"
            value={filters.groupBy}
            onChange={(e) => filters.setGroupBy(e.target.value as GroupByOption)}
            options={GROUP_BY_OPTIONS}
            className="min-w-0 flex-1 sm:w-36 sm:flex-none"
          />
        </div>
        <Checkbox
          checked={filters.showArchived}
          onChange={(e) => filters.setShowArchived(e.target.checked)}
          label="Show archived"
        />
        <Button
          variant="secondary"
          size="sm"
          className="sm:hidden"
          aria-expanded={pillsOpen}
          aria-controls={PILLS_ID}
          onClick={() => setPillsOpen((open) => !open)}
        >
          <SlidersHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Filters
          {filters.activeFilterCount > 0 && <span className="tabular-nums">({filters.activeFilterCount})</span>}
        </Button>
        <ViewToggle view={view} onViewChange={setView} />
      </ListToolbar>

      <div id={PILLS_ID} className={pillsOpen ? undefined : 'max-sm:hidden'}>
        <FilterButtons
          categories={filters.filterCategories}
          hasMoreCategories={filters.hasMoreFilterCategories}
          onLoadMoreCategories={filters.loadMoreFilterCategories}
          isLoadingMoreCategories={filters.isLoadingMoreFilterCategories}
          selectedCategories={filters.selectedCategories}
          onCategoryChange={filters.setSelectedCategories}
          selectedUnits={filters.selectedUnits}
          onUnitChange={filters.setSelectedUnits}
          selectedHalal={filters.selectedHalal}
          onHalalChange={filters.setSelectedHalal}
          allergens={allergens}
          selectedAllergens={filters.selectedAllergens}
          onAllergenChange={filters.setSelectedAllergens}
          hasSearch={!!filters.debouncedSearch}
        />
      </div>

      {body()}

      {data && (
        <Pagination
          pageNumber={data.page_number}
          totalPages={data.total_pages}
          totalCount={data.total_count}
          currentPageSize={data.current_page_size}
          onPageChange={filters.setPageNumber}
        />
      )}
    </div>
  );
}
