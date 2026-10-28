'use client';

/**
 * Library rows: draggable onto the canvas when drag and drop is on, and always addable with the
 * + button (the only way on a touch screen, so it is always visible and 44px there).
 */
import Image from 'next/image';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui';
import { useAppState } from '@/lib/store';
import { formatDisplayName } from '@/lib/format/displayName';
import { cn, formatCurrency } from '@/lib/utils';
import type { Ingredient, Recipe } from '@/types';
import { DisplayName } from '../StagedControls';
import { CANVAS_ADD_INGREDIENT_EVENT, CANVAS_ADD_RECIPE_EVENT } from '../types';
import { itemLabel } from '../canvasModel';

const cardClasses =
  'group flex items-center gap-2.5 rounded-lg bg-card px-3 py-2.5 hairline transition-colors hover:border-input';
const addButtonClasses =
  'grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors ' +
  'hover:bg-surface-hover hover:text-ink disabled:opacity-40 pointer-coarse:size-11';
const handleClasses = 'touch-none text-tertiary hover:text-ink';

export function DraggableIngredientCard({
  ingredient,
  categoryMap,
}: {
  ingredient: Ingredient;
  categoryMap: Record<number, string>;
}) {
  const { isDragDropEnabled } = useAppState();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `ingredient-${ingredient.id}`,
    data: { ingredient, type: 'ingredient' },
    disabled: !isDragDropEnabled,
  });
  const name = itemLabel(ingredient.name);
  const categoryName = ingredient.category_id ? categoryMap[ingredient.category_id] : null;
  const supplier = ingredient.supplier_names?.[0];

  return (
    <div ref={setNodeRef} data-ingredient-card className={cn(cardClasses, isDragging && 'opacity-50')}>
      {isDragDropEnabled && (
        <button
          {...listeners}
          {...attributes}
          aria-label={`Drag ${name}`}
          className={cn(handleClasses, 'cursor-grab active:cursor-grabbing')}
        >
          <GripVertical className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <DisplayName name={ingredient.name} className="text-sm font-medium text-ink" />
        {supplier && <p className="truncate text-xs text-tertiary">{formatDisplayName(supplier)}</p>}
        <p className="truncate text-xs text-tertiary">
          {categoryName && `${categoryName} · `}
          {ingredient.base_unit}
          {ingredient.cost_per_base_unit !== null && (
            <span className="tabular-nums">
              {' · '}
              {formatCurrency(ingredient.cost_per_base_unit)}/{ingredient.base_unit}
            </span>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(CANVAS_ADD_INGREDIENT_EVENT, { detail: { ingredient } }))}
        className={addButtonClasses}
        aria-label={`Add ${name} to canvas`}
      >
        <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}

export function DraggableRecipeCard({
  recipe,
  outletNames,
  categoryNames,
}: {
  recipe: Recipe;
  outletNames: string[];
  categoryNames: string[];
}) {
  const { selectedRecipeId, isDragDropEnabled } = useAppState();
  const isCurrentRecipe = recipe.id === selectedRecipeId;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipe, type: 'recipe' },
    disabled: isCurrentRecipe || !isDragDropEnabled,
  });
  const name = itemLabel(recipe.name);

  const handleAdd = () => {
    if (isCurrentRecipe) {
      toast.warning('Cannot add this recipe to itself');
      return;
    }
    window.dispatchEvent(new CustomEvent(CANVAS_ADD_RECIPE_EVENT, { detail: { recipe } }));
  };

  return (
    <div
      ref={setNodeRef}
      data-recipe-card
      className={cn(cardClasses, isDragging && 'opacity-50', isCurrentRecipe && 'cursor-not-allowed opacity-60')}
    >
      {isDragDropEnabled && (
        <button
          {...listeners}
          {...attributes}
          aria-label={`Drag ${name}`}
          disabled={isCurrentRecipe}
          className={cn(handleClasses, isCurrentRecipe ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing')}
        >
          <GripVertical className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
      {recipe.image_url && (
        <div className="relative size-8 shrink-0 overflow-hidden rounded-md">
          <Image src={recipe.image_url} alt={name} fill className="object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <DisplayName name={recipe.name} className="text-sm font-medium text-ink" />
          {isCurrentRecipe && <span className="shrink-0 text-xs font-medium text-tertiary">Current</span>}
        </div>
        <p className="truncate text-xs text-tertiary">
          {recipe.yield_quantity} {recipe.yield_unit}
          {outletNames.length > 0 && ` · ${outletNames.join(', ')}`}
          {categoryNames.length > 0 && ` · ${categoryNames.join(', ')}`}
        </p>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={isCurrentRecipe}
        className={addButtonClasses}
        aria-label={isCurrentRecipe ? `${name} is this recipe` : `Add ${name} to canvas`}
      >
        <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}

export function LibrarySkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg p-3 hairline">
          <Skeleton className="mb-2 h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
