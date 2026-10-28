'use client';

/** Ingredients → Tags: the ingredient categories, added in a panel and edited with autosave. */
import { useEffect, useState } from 'react';
import { Tags } from 'lucide-react';
import { toast } from 'sonner';
import { useCategoriesPaginated, useUpdateCategory, useDeactivateCategory, useDebouncedValue } from '@/lib/hooks';
import { CategoryCard, CategoryListRow, AddCategoryModal } from '@/components/categories';
import { TAG_COPY } from '@/components/categories/AddCategoryModal';
import { NameDescriptionEditPanel } from '@/components/forms/NameDescriptionPanels';
import { ReferenceListView, type ListView } from '@/components/lists/ReferenceListView';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Category } from '@/types';

const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;

export function CategoriesTab() {
  const deactivateCategory = useDeactivateCategory();
  const updateCategory = useUpdateCategory();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [view, setView] = useState<ListView>('grid');
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => setPageNumber(1), [debouncedSearch, showArchived]);

  const { data, isLoading, error } = useCategoriesPaginated({
    active_only: !showArchived,
    page_number: pageNumber,
    page_size: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });
  const categories = data?.items ?? [];
  // Read the record being edited from the live list, so autosaved changes flow back into the panel.
  const editing = categories.find((c) => c.id === editingId) ?? null;

  const handleArchive = (category: Category) => {
    const name = formatDisplayName(category.name);
    deactivateCategory.mutate(category.id, {
      onSuccess: () => toast.success(`${name} archived`),
      onError: () => toast.error(`Failed to archive ${name}`),
    });
  };

  const handleUnarchive = (category: Category) => {
    const name = formatDisplayName(category.name);
    updateCategory.mutate(
      { id: category.id, data: { is_active: true } },
      {
        onSuccess: () => toast.success(`${name} unarchived`),
        onError: () => toast.error(`Failed to unarchive ${name}`),
      }
    );
  };

  const edit = (category: Category) => setEditingId(category.id);

  return (
    <ReferenceListView
      title="Tags"
      description="Group ingredients so they are quicker to find and filter."
      noun="tags"
      icon={Tags}
      emptyDescription="New ingredients are tagged automatically from their name."
      onAdd={() => setShowForm(true)}
      addLabel="Add tag"
      search={search}
      onSearchChange={setSearch}
      showArchived={showArchived}
      onShowArchivedChange={setShowArchived}
      view={view}
      onViewChange={setView}
      items={categories}
      isLoading={isLoading}
      error={error}
      renderItem={(category, itemView) => {
        const Item = itemView === 'grid' ? CategoryCard : CategoryListRow;
        return (
          <Item key={category.id} category={category} onEdit={edit} onArchive={handleArchive} onUnarchive={handleUnarchive} />
        );
      }}
      page={data}
      onPageChange={setPageNumber}
    >
      <AddCategoryModal isOpen={showForm} onClose={() => setShowForm(false)} />
      <NameDescriptionEditPanel
        record={editing}
        onClose={() => setEditingId(null)}
        copy={TAG_COPY}
        update={(patch) => updateCategory.mutateAsync({ id: editingId as number, data: patch })}
      />
    </ReferenceListView>
  );
}
