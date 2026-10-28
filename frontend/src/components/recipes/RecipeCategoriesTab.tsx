'use client';

/**
 * Dish categories: added in a panel, opened on their own page to edit. Archiving asks first,
 * because a category groups dishes on menus.
 */
import { useEffect, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useRecipeCategories, useUpdateRecipeCategory, useDeleteRecipeCategory, useDebouncedValue } from '@/lib/hooks';
import { ConfirmModal } from '@/components/ui';
import { ReferenceListView, type ListView } from '@/components/lists/ReferenceListView';
import { formatDisplayName } from '@/lib/format/displayName';
import type { RecipeCategory } from '@/types';
import { RecipeCategoryCard } from './RecipeCategoryCard';
import { RecipeCategoryListRow } from './RecipeCategoryListRow';
import { AddRecipeCategoryModal } from './AddRecipeCategoryModal';

const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;

export function RecipeCategoriesTab() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [view, setView] = useState<ListView>('grid');
  const [archiveConfirm, setArchiveConfirm] = useState<RecipeCategory | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => setPageNumber(1), [debouncedSearch, showArchived]);

  const { data, isLoading, error } = useRecipeCategories({
    active_only: !showArchived,
    page_size: PAGE_SIZE,
    page_number: pageNumber,
    search: debouncedSearch || undefined,
  });
  const deleteRecipeCategory = useDeleteRecipeCategory();
  const updateRecipeCategory = useUpdateRecipeCategory();

  const handleUnarchive = (category: RecipeCategory) => {
    const name = formatDisplayName(category.name);
    updateRecipeCategory.mutate(
      { id: category.id, data: { is_active: true } },
      {
        onSuccess: () => toast.success(`${name} unarchived`),
        onError: () => toast.error(`Failed to unarchive ${name}`),
      }
    );
  };

  const handleConfirmArchive = () => {
    if (!archiveConfirm) return;
    const name = formatDisplayName(archiveConfirm.name);
    deleteRecipeCategory.mutate(archiveConfirm.id, {
      onSuccess: () => toast.success(`${name} archived`),
      onError: () => toast.error('Failed to archive category'),
      onSettled: () => setArchiveConfirm(null),
    });
  };

  return (
    <ReferenceListView
      title="Categories"
      description="Group dishes into the sections of a menu."
      noun="categories"
      icon={FolderOpen}
      onAdd={() => setShowForm(true)}
      addLabel="Add category"
      search={search}
      onSearchChange={setSearch}
      showArchived={showArchived}
      onShowArchivedChange={setShowArchived}
      view={view}
      onViewChange={setView}
      items={data?.items ?? []}
      isLoading={isLoading}
      error={error}
      renderItem={(category, itemView) => {
        const Item = itemView === 'grid' ? RecipeCategoryCard : RecipeCategoryListRow;
        return <Item key={category.id} category={category} onArchive={setArchiveConfirm} onUnarchive={handleUnarchive} />;
      }}
      page={data}
      onPageChange={setPageNumber}
    >
      <AddRecipeCategoryModal isOpen={showForm} onClose={() => setShowForm(false)} />
      <ConfirmModal
        isOpen={!!archiveConfirm}
        onClose={() => setArchiveConfirm(null)}
        onConfirm={handleConfirmArchive}
        title="Archive category?"
        message={`${archiveConfirm ? formatDisplayName(archiveConfirm.name) : 'This category'} is hidden from lists. Tick "Show archived" to restore it.`}
        confirmLabel="Archive"
        variant="destructive"
        pending={deleteRecipeCategory.isPending}
      />
    </ReferenceListView>
  );
}
