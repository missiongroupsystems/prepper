'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import {
  useAddRecipeIngredient,
  useCreateIngredient,
  useRemoveRecipeIngredient,
  useUpdateMenuSketchSectionItem,
} from '@/lib/hooks';
import * as api from '@/lib/api';
import type { Ingredient, MenuSketchSectionItem, RecipeIngredient } from '@/types';
import { cn } from '@/lib/utils';
import { popoverClasses, popoverOptionClasses } from './shared';

const INGREDIENT_PAGE_SIZE = 8;
const INGREDIENT_SEARCH_STALE_MS = 30 * 1000;
const SUGGESTION_CLOSE_DELAY_MS = 150;

/** Linked ingredients as removable chips. */
export function IngredientChips({
  item,
  recipeIngredients,
  className,
}: {
  item: MenuSketchSectionItem;
  recipeIngredients: RecipeIngredient[];
  className?: string;
}) {
  const removeIngredient = useRemoveRecipeIngredient();
  if (recipeIngredients.length === 0) return null;
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)} aria-label="Ingredients">
      {recipeIngredients.map((ri) => {
        const name = ri.ingredient?.name ?? `Ingredient #${ri.ingredient_id}`;
        return (
          <li
            key={ri.id}
            className="inline-flex items-center gap-1 rounded-full bg-surface-sunken py-0.5 pr-1 pl-2.5 text-xs font-medium text-muted-foreground"
          >
            {name}
            <button
              type="button"
              onClick={() => removeIngredient.mutate({ recipeId: item.recipe_id!, ingredientId: ri.id })}
              className="inline-flex size-4 items-center justify-center rounded-full text-tertiary hover:bg-surface-hover hover:text-danger"
              aria-label={`Remove ${name}`}
              title="Remove ingredient"
            >
              <X className="size-3" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** "Add ingredient" search: picks an existing ingredient or creates one, then links it to the dish's recipe. */
export function IngredientSearchInput({
  item,
  recipeIngredients,
  className,
}: {
  item: MenuSketchSectionItem;
  recipeIngredients: RecipeIngredient[];
  className?: string;
}) {
  const updateItem = useUpdateMenuSketchSectionItem();
  const addIngredient = useAddRecipeIngredient();
  const createIngredient = useCreateIngredient();
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pageSize, setPageSize] = useState(INGREDIENT_PAGE_SIZE);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const linkedIngredientIds = new Set(recipeIngredients.map((ri) => ri.ingredient_id));
  const searchTerm = ingredientSearch.trim();
  const { data: searchData } = useQuery({
    queryKey: ['ingredients-search', searchTerm, pageSize],
    queryFn: () => api.getIngredients({ search: searchTerm, page_size: pageSize, active_only: true }),
    enabled: !!searchTerm,
    placeholderData: (prev) => prev,
    staleTime: INGREDIENT_SEARCH_STALE_MS,
  });
  const suggested = (searchData?.items ?? []).filter((ing) => !linkedIngredientIds.has(ing.id));
  const hasMore = searchData ? searchData.total_count > pageSize : false;

  const reset = () => {
    setIngredientSearch('');
    setPageSize(INGREDIENT_PAGE_SIZE);
    setSelectedIndex(-1);
    setShowSuggestions(false);
  };

  // A dish with tasting notes is re-saved under its name first, which forks its recipe;
  // the ingredient then lands on the new recipe.
  const withEditableRecipe = (run: (recipeId: number) => void) => {
    if (!item.recipe_id) return;
    if (item.tasting_notes.length > 0 && item.recipe_name) {
      updateItem.mutate(
        { id: item.id, data: { name: item.recipe_name }, prevRecipeId: item.recipe_id },
        { onSuccess: (updated) => { if (updated.recipe_id) run(updated.recipe_id); } }
      );
    } else {
      run(item.recipe_id);
    }
  };

  const handleAdd = (ing: Ingredient) =>
    withEditableRecipe((recipeId) => {
      addIngredient.mutate({
        recipeId,
        data: {
          ingredient_id: ing.id,
          quantity: 1,
          unit: ing.base_unit,
          base_unit: ing.base_unit,
          unit_price: ing.cost_per_base_unit ?? 0,
          supplier_id: null,
        },
      });
      reset();
    });

  const handleCreateAndAdd = (name: string) =>
    withEditableRecipe((recipeId) => {
      createIngredient.mutate(
        { name, base_unit: 'unit' },
        {
          onSuccess: (newIng) => {
            addIngredient.mutate({
              recipeId,
              data: {
                ingredient_id: newIng.id,
                quantity: 1,
                unit: newIng.base_unit,
                base_unit: newIng.base_unit,
                unit_price: 0,
                supplier_id: null,
              },
            });
          },
        }
      );
      reset();
    });

  if (!item.recipe_id) return null;

  return (
    <div className={cn('relative', className)}>
      <Plus
        className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-tertiary"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <input
        type="text"
        aria-label="Add ingredient"
        value={ingredientSearch}
        onChange={(e) => {
          setIngredientSearch(e.target.value);
          setPageSize(INGREDIENT_PAGE_SIZE);
          setSelectedIndex(-1);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), SUGGESTION_CLOSE_DELAY_MS)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, suggested.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, -1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < suggested.length) handleAdd(suggested[selectedIndex]);
            else if (suggested.length > 0) handleAdd(suggested[0]);
            else if (searchTerm) handleCreateAndAdd(searchTerm);
          }
        }}
        placeholder="Add ingredient"
        className={cn(
          'h-8 w-full rounded-md border border-transparent bg-transparent pr-2 pl-7 text-[13px] text-ink max-sm:h-11 max-sm:text-base',
          'placeholder:text-placeholder transition-[border-color,background-color] duration-(--dur-quick)',
          'hover:border-input focus:border-input focus:bg-surface-sunken',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
        )}
      />
      {showSuggestions && (suggested.length > 0 || searchTerm) && (
        <div className={cn(popoverClasses, 'max-h-56 min-w-56')}>
          {suggested.map((ing, idx) => (
            <button
              key={ing.id}
              type="button"
              onMouseDown={() => handleAdd(ing)}
              className={cn(popoverOptionClasses, idx === selectedIndex && 'bg-surface-hover')}
            >
              {ing.name}
            </button>
          ))}
          {hasMore && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setPageSize((p) => p + INGREDIENT_PAGE_SIZE);
              }}
              className={cn(popoverOptionClasses, 'text-muted-foreground')}
            >
              Load more…
            </button>
          )}
          {searchTerm && (
            <button
              type="button"
              onMouseDown={() => handleCreateAndAdd(searchTerm)}
              className={cn(popoverOptionClasses, 'text-accent')}
            >
              <Plus className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
              Create &ldquo;{searchTerm}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
