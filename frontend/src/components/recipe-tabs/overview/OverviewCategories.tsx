'use client';

/**
 * The recipe's categories as removable chips, and a searchable picker that adds an existing
 * category or creates one from the search text.
 */
import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  useCreateRecipeCategory,
  useRecipeCategories,
  useRecipeCategoryLinks,
} from '@/lib/hooks';
import { useAddRecipeToCategory, useRemoveRecipeFromCategory } from '@/lib/hooks/useRecipeRecipeCategories';
import { Button, Input } from '@/components/ui';
import { OverviewSection } from './OverviewSection';

const ICON = { className: 'size-4', strokeWidth: 1.5, 'aria-hidden': 'true' } as const;
const PICKER_ITEM =
  'w-full px-4 py-2 text-left text-sm transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50';

export function OverviewCategories({ recipeId, canEdit }: { recipeId: number; canEdit: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  const { data: links = [] } = useRecipeCategoryLinks(recipeId);
  const { data: allCategoriesData } = useRecipeCategories({ page_size: 30 });
  const allCategories = allCategoriesData?.items ?? [];
  const { mutate: addToCategory, isPending: isAdding } = useAddRecipeToCategory();
  const { mutate: removeFromCategory, isPending: isRemoving } = useRemoveRecipeFromCategory();
  const { mutate: createCategory, isPending: isCreating } = useCreateRecipeCategory();

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    setSearch('');
  };

  const linked = links.flatMap((link) => {
    const category = allCategories.find((c) => c.id === link.category_id);
    return category ? [{ link, category }] : [];
  });
  const query = search.toLowerCase();
  const available = allCategories.filter(
    (cat) => !links.some((link) => link.category_id === cat.id) && cat.name.toLowerCase().includes(query)
  );

  const add = (categoryId: number) => {
    addToCategory({ recipe_id: recipeId, category_id: categoryId });
    close();
  };

  const createAndAdd = () =>
    createCategory({ name: search }, { onSuccess: (category) => add(category.id) });

  return (
    <OverviewSection title="Categories">
      <div className="flex flex-wrap items-center gap-2">
        {linked.length === 0 && <p className="text-sm text-tertiary">No categories yet</p>}
        {linked.map(({ link, category }) => (
          <span key={link.id} className="inline-flex items-center gap-1 rounded-full bg-surface-sunken py-1 pr-1 pl-3 text-sm text-ink">
            {category.name}
            {canEdit && (
              <button
                type="button"
                onClick={() => removeFromCategory({ linkId: link.id, categoryId: category.id, recipeId })}
                disabled={isRemoving}
                aria-label={`Remove ${category.name}`}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-hover hover:text-ink disabled:opacity-50"
              >
                <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            )}
          </span>
        ))}

        {canEdit && (
          <div className="relative" ref={pickerRef}>
            <Button variant="secondary" size="sm" onClick={() => (isOpen ? close() : setIsOpen(true))} disabled={isAdding} aria-expanded={isOpen}>
              <Plus {...ICON} />
              Add category
            </Button>
            {isOpen && (
              <div className="absolute top-full left-0 z-50 mt-2 w-64 overflow-hidden rounded-lg bg-popover shadow-pop hairline">
                <div className="border-b border-line p-2">
                  <Input
                    placeholder="Search categories"
                    aria-label="Search categories"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && close()}
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {available.map((category) => (
                    <button key={category.id} type="button" onClick={() => add(category.id)} disabled={isAdding} className={`${PICKER_ITEM} text-ink`}>
                      {category.name}
                    </button>
                  ))}
                  {available.length === 0 && search && (
                    <button type="button" onClick={createAndAdd} disabled={isCreating} className={`${PICKER_ITEM} text-accent`}>
                      Create &ldquo;{search}&rdquo;
                    </button>
                  )}
                  {available.length === 0 && !search && (
                    <p className="px-4 py-3 text-center text-sm text-tertiary">
                      {allCategories.length === 0 ? 'No categories yet' : 'Every category is added'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </OverviewSection>
  );
}
