'use client';

/**
 * The creator's dish picker: a SidePanel with search, a checklist of dishes (those already in the
 * session start ticked), "Load more", and "Create … as new dish" for a name that isn't there.
 * The footer applies the ticks: adds the newly ticked, removes the unticked.
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Checkbox, Label, SearchInput, SidePanel } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Recipe } from '@/types';

interface AddDishesPanelProps {
  open: boolean;
  onClose: () => void;
  linkedRecipeIds: Set<number>;
  selectedRecipeIds: Set<number>;
  onToggle: (recipeId: number) => void;
  onApply: () => void;
  availableRecipes: Recipe[];
  hasMoreRecipes: boolean;
  onLoadMoreRecipes: () => void;
  isLoadingMoreRecipes: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateAndSelect: () => Promise<void>;
}

export function AddDishesPanel({
  open,
  onClose,
  linkedRecipeIds,
  selectedRecipeIds,
  onToggle,
  onApply,
  availableRecipes,
  hasMoreRecipes,
  onLoadMoreRecipes,
  isLoadingMoreRecipes,
  searchQuery,
  onSearchChange,
  onCreateAndSelect,
}: AddDishesPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const toAdd = [...selectedRecipeIds].filter((id) => !linkedRecipeIds.has(id)).length;
  const toRemove = [...linkedRecipeIds].filter((id) => !selectedRecipeIds.has(id)).length;
  const trimmedQuery = searchQuery.trim();

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onCreateAndSelect();
    } finally {
      setIsCreating(false);
    }
  };

  const applyLabel =
    toRemove > 0 ? 'Update dishes' : toAdd > 0 ? `Add ${toAdd} dish${toAdd !== 1 ? 'es' : ''}` : 'Add dishes';

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Dishes in this session"
      description="Tick the dishes to taste. Unticking one removes it from the session."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onApply} disabled={toAdd === 0 && toRemove === 0}>
            {applyLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="session-dish-search">Search dishes</Label>
          <SearchInput
            id="session-dish-search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
            placeholder="Type a dish name…"
            autoFocus
          />
        </div>

        <ul className="flex flex-col divide-y divide-line rounded-lg hairline">
          {availableRecipes.length === 0 && (
            <li className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? 'No dishes match your search' : 'No dishes available'}
            </li>
          )}
          {availableRecipes.map((recipe) => (
            <li key={recipe.id} className="flex min-h-11 items-center px-3 py-1.5">
              <Checkbox
                label={formatDisplayName(recipe.name)}
                checked={selectedRecipeIds.has(recipe.id)}
                onChange={() => onToggle(recipe.id)}
              />
            </li>
          ))}
          {hasMoreRecipes && (
            <li className="p-1.5">
              <Button variant="ghost" size="sm" onClick={onLoadMoreRecipes} loading={isLoadingMoreRecipes} className="w-full">
                Load more dishes
              </Button>
            </li>
          )}
          {trimmedQuery && (
            <li className="p-1.5">
              <Button variant="ghost" size="sm" onClick={handleCreate} loading={isCreating} className="w-full justify-start">
                {!isCreating && <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />}
                Create &ldquo;{trimmedQuery}&rdquo; as a new dish
              </Button>
            </li>
          )}
        </ul>
      </div>
    </SidePanel>
  );
}
