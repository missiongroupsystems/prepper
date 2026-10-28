'use client';

import { useId } from 'react';
import { X } from 'lucide-react';
import type { MenuSketchSectionItem, Recipe } from '@/types';
import { Card, Checkbox, Label } from '@/components/ui';
import { cn } from '@/lib/utils';
import { DescriptionField, DishDialogs, DishFooter } from './dish-actions';
import { CostPercent, DishNameField, PriceField, useDish } from './dish-fields';
import { IngredientChips, IngredientSearchInput } from './dish-ingredients';
import { quietIconClasses } from './shared';
import { DragHandle, type DragHandleProps } from './sortable';

export interface DishProps {
  item: MenuSketchSectionItem;
  unresolvedCount: number;
  onOpenComments: () => void;
  recipes: Recipe[];
  dragHandleProps?: DragHandleProps;
  isSelected: boolean;
  onToggle: () => void;
}

/** Grid view: one dish as a card — title row, ingredients, prices, description, footer. */
export function DishCard({
  item,
  unresolvedCount,
  onOpenComments,
  recipes,
  dragHandleProps,
  isSelected,
  onToggle,
}: DishProps) {
  const dish = useDish(item);
  const fieldId = useId();
  const dishLabel = item.recipe_name || 'dish';

  return (
    <Card
      className={cn(
        'flex flex-col gap-4',
        item.is_highlight && 'bg-surface-selected',
        isSelected && 'ring-1 ring-accent'
      )}
    >
      <div className="-mt-1 -mr-2 -ml-2 flex items-center gap-1">
        <DragHandle handle={dragHandleProps} label={`Reorder ${dishLabel}`} />
        <DishNameField item={item} recipes={recipes} save={dish.save} className="mx-0" />
        <label
          className={cn(quietIconClasses, 'cursor-pointer')}
          title="Select for a tasting session"
        >
          <Checkbox
            checked={isSelected}
            onChange={onToggle}
            aria-label={`Select ${dishLabel} for a tasting session`}
          />
        </label>
        <button
          type="button"
          onClick={() => dish.setConfirmDelete(true)}
          className={cn(quietIconClasses, 'hover:text-danger')}
          aria-label={`Remove ${dishLabel}`}
          title="Remove dish"
        >
          <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      {item.recipe_id && (
        <div className="-mt-2 flex flex-col gap-2">
          <IngredientChips item={item} recipeIngredients={dish.recipeIngredients} />
          <IngredientSearchInput item={item} recipeIngredients={dish.recipeIngredients} className="-ml-2" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-sale`} className="text-right text-xs">Sale</Label>
          <PriceField
            id={`${fieldId}-sale`}
            label="Sale price"
            value={item.sales_price}
            onCommit={(val) => dish.save({ sales_price: val })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-cost`} className="text-right text-xs">Cost</Label>
          <PriceField
            id={`${fieldId}-cost`}
            label="Cost price"
            value={item.cost_price}
            onCommit={(val) => dish.save({ cost_price: val })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-right text-xs leading-5 font-medium text-muted-foreground">Food cost</span>
          <CostPercent item={item} className="flex h-9 items-center justify-end text-sm max-sm:h-11" />
        </div>
      </div>

      <DescriptionField item={item} save={dish.save} />

      <DishFooter item={item} dish={dish} unresolvedCount={unresolvedCount} onOpenComments={onOpenComments} />

      <DishDialogs item={item} dish={dish} />
    </Card>
  );
}
