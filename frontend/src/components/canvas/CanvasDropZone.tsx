'use client';

import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Carrot } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import type { CanvasViewMode } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { Ingredient, Recipe, SupplierIngredient } from '@/types';
import { CanvasTable } from './CanvasTable';
import { StagedIngredientCard } from './StagedIngredientCard';
import { StagedRecipeCard } from './StagedRecipeCard';
import { StagedIngredientRow, StagedRecipeRow } from './StagedRows';
import type { RecipeLabels, StagedIngredient, StagedItemActions, StagedRecipe } from './types';

/** The droppable id the drag handler checks for. */
export const CANVAS_DROP_ZONE_ID = 'canvas-drop-zone';

/**
 * Where library items are dropped, and where the staged items show as cards, rows or a table.
 * Empty, it explains how to fill it; `emptyActions` are the buttons that do.
 */
export function CanvasDropZone({
  stagedIngredients,
  stagedRecipes,
  actions,
  supplierMap,
  categoryMap,
  recipeLabels,
  allRecipes,
  allIngredients,
  viewMode,
  emptyActions,
}: {
  stagedIngredients: StagedIngredient[];
  stagedRecipes: StagedRecipe[];
  actions: StagedItemActions;
  supplierMap: Record<number, SupplierIngredient[]>;
  categoryMap: Record<number, string>;
  recipeLabels: RecipeLabels;
  allRecipes?: Recipe[];
  allIngredients?: Ingredient[];
  viewMode: CanvasViewMode;
  emptyActions: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROP_ZONE_ID });
  const hasItems = stagedIngredients.length > 0 || stagedRecipes.length > 0;

  const ingredientProps = (staged: StagedIngredient) => ({
    staged,
    suppliers: supplierMap[staged.ingredient.id] ?? [],
    categoryMap,
    onRemove: () => actions.onRemoveIngredient(staged.id),
    onQuantityChange: (q: number) => actions.onIngredientQuantityChange(staged.id, q),
    onWastageChange: (w: number) => actions.onIngredientWastageChange(staged.id, w),
    onUnitChange: (u: string) => actions.onIngredientUnitChange(staged.id, u),
    onSupplierSelect: (sid: number | null) => actions.onSupplierSelect(staged.id, sid),
  });
  const recipeProps = (staged: StagedRecipe) => ({
    staged,
    allRecipes,
    outletNames: recipeLabels.getOutletNamesForRecipe(staged.recipe.id),
    categoryNames: recipeLabels.getCategoryNamesForRecipe(staged.recipe.id),
    onRemove: () => actions.onRemoveRecipe(staged.id),
    onQuantityChange: (q: number) => actions.onRecipeQuantityChange(staged.id, q),
  });

  return (
    <div
      ref={setNodeRef}
      data-testid="canvas-drop-zone"
      className={cn(
        'min-h-full rounded-lg border border-dashed transition-colors duration-(--dur-base)',
        isOver ? 'border-accent bg-surface-selected' : 'border-input',
        viewMode === 'table' && hasItems ? 'p-0' : 'p-4 sm:p-5'
      )}
    >
      {!hasItems ? (
        <EmptyState
          bare
          icon={Carrot}
          title="No ingredients yet"
          description="Drag ingredients or recipes here from the library, or paste a list to add several at once."
          action={emptyActions}
          className="py-16"
        />
      ) : viewMode === 'table' ? (
        <CanvasTable
          stagedIngredients={stagedIngredients}
          stagedRecipes={stagedRecipes}
          actions={actions}
          allIngredients={allIngredients}
          allRecipes={allRecipes}
          categoryMap={categoryMap}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] items-start gap-4">
          {stagedIngredients.map((staged) => (
            <StagedIngredientCard key={staged.id} {...ingredientProps(staged)} />
          ))}
          {stagedRecipes.map((staged) => (
            <StagedRecipeCard key={staged.id} {...recipeProps(staged)} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {stagedIngredients.map((staged) => (
            <StagedIngredientRow key={staged.id} {...ingredientProps(staged)} />
          ))}
          {stagedRecipes.map((staged) => (
            <StagedRecipeRow key={staged.id} {...recipeProps(staged)} />
          ))}
        </div>
      )}
    </div>
  );
}
