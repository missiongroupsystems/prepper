'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useDraggable } from '@dnd-kit/core';
import { ChevronDown, GripVertical, ImagePlus } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useRecipeIngredients, useSubRecipes } from '@/lib/hooks';
import { formatDisplayName } from '@/lib/format/displayName';
import { formatCurrency } from '@/lib/utils';
import type { Recipe } from '@/types';
import { DisplayName, QuantityStepper, RowActions } from './StagedControls';
import { stagedCardClasses } from './StagedIngredientCard';
import type { StagedRecipe } from './types';
import { itemLabel } from './canvasModel';

/** A staged sub-recipe; expanding it loads its ingredients, scaled to the staged quantity. */
export function StagedRecipeCard({
  staged,
  allRecipes,
  outletNames,
  categoryNames,
  onRemove,
  onQuantityChange,
}: {
  staged: StagedRecipe;
  allRecipes?: Recipe[];
  outletNames: string[];
  categoryNames: string[];
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `staged-recipe-${staged.id}`,
    data: { type: 'staged-recipe', stagedId: staged.id },
  });
  const { data: recipeIngredients } = useRecipeIngredients(isExpanded ? staged.recipe.id : null);
  const { data: subRecipes } = useSubRecipes(isExpanded ? staged.recipe.id : null);
  const name = itemLabel(staged.recipe.name);
  const yieldQty = (staged.recipe.yield_quantity ?? 1) > 0 ? (staged.recipe.yield_quantity ?? 1) : 1;
  const scale = staged.quantity / yieldQty;

  return (
    <div
      ref={setNodeRef}
      // dnd-kit's live drag offset — the one thing a utility cannot say.
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isExpanded ? 10 : 1,
      }}
      className={stagedCardClasses}
    >
      {staged.recipe.image_url ? (
        <div className="relative h-20">
          <Image src={staged.recipe.image_url} alt={name} fill className="object-cover" />
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center bg-muted">
          <ImagePlus className="size-7 text-placeholder" strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}

      <div className="flex items-start gap-1.5 px-3 pt-3">
        <button
          {...listeners}
          {...attributes}
          aria-label={`Drag ${name}`}
          className="mt-0.5 cursor-grab touch-none text-tertiary hover:text-ink"
        >
          <GripVertical className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <DisplayName name={staged.recipe.name} className="text-sm font-medium text-ink" />
          <span className="text-xs text-tertiary">Recipe</span>
        </div>
        <RowActions itemName={name} onRemove={onRemove} />
      </div>

      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2">
          <QuantityStepper value={staged.quantity} onChange={onQuantityChange} itemName={name} />
          <Badge>portion</Badge>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            Yield: {staged.recipe.yield_quantity} {staged.recipe.yield_unit}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? `Hide details for ${name}` : `Show details for ${name}`}
            aria-expanded={isExpanded}
          >
            <ChevronDown
              className={isExpanded ? 'size-4 rotate-180 transition-transform' : 'size-4 transition-transform'}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </Button>
        </div>

        {(outletNames.length > 0 || categoryNames.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {outletNames.map((label) => (
              <Badge key={`outlet-${label}`}>{label}</Badge>
            ))}
            {categoryNames.map((label) => (
              <Badge key={`category-${label}`}>{label}</Badge>
            ))}
          </div>
        )}

        {isExpanded && (
          <div className="max-h-56 space-y-3 overflow-y-auto border-t border-border pt-3 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Ingredients</span>
              {recipeIngredients && recipeIngredients.length > 0 ? (
                <ul className="mt-1.5 space-y-1.5">
                  {recipeIngredients.map((ri) => {
                    const suppliers = ri.ingredient?.supplier_ingredients || [];
                    const preferred = suppliers.find((s) => s.is_preferred);
                    const scaledQty = parseFloat((ri.quantity * scale).toFixed(3));
                    const unit = ri.base_unit || ri.unit;
                    return (
                      <li key={ri.id} className="rounded-md bg-secondary p-2">
                        <DisplayName
                          name={ri.ingredient?.name || `Ingredient #${ri.ingredient_id}`}
                          className="font-medium text-ink"
                        />
                        <div className="flex flex-wrap gap-x-2 tabular-nums text-muted-foreground">
                          <span>
                            {scaledQty} {unit}
                          </span>
                          {ri.unit_price != null && (
                            <span className="font-medium text-ink">
                              {formatCurrency(scaledQty * ri.unit_price)} (${ri.unit_price.toFixed(2)}/{unit})
                            </span>
                          )}
                        </div>
                        {suppliers.length > 0 && (
                          <div className="mt-0.5 text-muted-foreground">
                            {formatDisplayName(preferred?.supplier_name || suppliers[0]?.supplier_name || '')}
                            {preferred && <Badge className="ml-1">Preferred</Badge>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-1 text-tertiary">No ingredients</p>
              )}
            </div>

            {subRecipes && subRecipes.length > 0 && (
              <div>
                <span className="font-medium text-muted-foreground">Sub-recipes</span>
                <ul className="mt-1.5 space-y-1.5">
                  {subRecipes.map((sr) => {
                    const child = allRecipes?.find((r) => r.id === sr.child_recipe_id);
                    return (
                      <li key={sr.id} className="rounded-md bg-secondary p-2">
                        <div className="font-medium text-ink">
                          {formatDisplayName(child?.name || `Recipe #${sr.child_recipe_id}`)}
                        </div>
                        <div className="tabular-nums text-muted-foreground">
                          {sr.quantity} {sr.unit}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
