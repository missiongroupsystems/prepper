'use client';

/**
 * Server-searched dish list for the builder's panels: a search field over a scrolling list with
 * "View more". Rows are toggles (`aria-pressed`); dishes already on the section are disabled.
 */
import { useState } from 'react';
import { Check } from 'lucide-react';
import { useDebouncedValue, useInfiniteRecipes } from '@/lib/hooks';
import { Button, EmptyState, SearchInput } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import { cn } from '@/lib/utils';
import type { PickedRecipe } from './draftOps';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

export function RecipeSearchList({
  selectedIds,
  unavailableIds,
  onPick,
  label,
}: {
  selectedIds: ReadonlySet<number>;
  /** Already on the section — shown, but not pickable. */
  unavailableIds: ReadonlySet<number>;
  onPick: (recipe: PickedRecipe) => void;
  /** Accessible name for the search field. */
  label: string;
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteRecipes({
    search: debounced.trim() || undefined,
    page_size: PAGE_SIZE,
  });
  const recipes = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        aria-label={label}
        placeholder="Search dishes…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
      />
      <div className="overflow-hidden rounded-lg hairline">
        {!isLoading && recipes.length === 0 ? (
          <EmptyState bare title="No dishes found" description="Try a different name." />
        ) : (
          <ul className="max-h-80 divide-y divide-line overflow-y-auto">
            {recipes.map((recipe) => {
              const unavailable = unavailableIds.has(recipe.id);
              const selected = selectedIds.has(recipe.id);
              return (
                <li key={recipe.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    disabled={unavailable}
                    onClick={() => onPick({ id: recipe.id, name: recipe.name })}
                    className={cn(
                      'flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm text-ink transition-colors',
                      'hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none',
                      'disabled:cursor-not-allowed disabled:text-disabled disabled:hover:bg-transparent',
                      selected && 'bg-surface-hover'
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'grid size-[18px] shrink-0 place-items-center rounded-sm border border-input',
                        selected && 'border-accent bg-accent text-accent-foreground'
                      )}
                    >
                      {selected && <Check className="size-3" strokeWidth={1.5} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{formatDisplayName(recipe.name)}</span>
                    {unavailable && <span className="shrink-0 text-[13px] text-tertiary">On this section</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => fetchNextPage()}
          loading={isFetchingNextPage}
        >
          View more
        </Button>
      )}
    </div>
  );
}
