'use client';

import { Checkbox } from '@/components/ui';
import { cn } from '@/lib/utils';
import { DescriptionField, DishDialogs, DishFooter } from './dish-actions';
import type { DishProps } from './DishCard';
import { CostPercent, DishNameField, PriceField, useDish } from './dish-fields';
import { IngredientChips, IngredientSearchInput } from './dish-ingredients';
import { DragHandle } from './sortable';

/**
 * Column template shared by the list header and every row. Below `sm` the row stacks:
 * handle + name, then ingredients, then the three figures.
 */
export const LIST_COLUMNS =
  'grid grid-cols-[44px_repeat(3,minmax(0,1fr))] sm:grid-cols-[44px_minmax(0,1fr)_minmax(0,1.4fr)_96px_96px_72px]';

/** List view: one dish as a table-like row with its details underneath. */
export function DishRow({
  item,
  unresolvedCount,
  onOpenComments,
  recipes,
  dragHandleProps,
  isSelected,
  onToggle,
}: DishProps) {
  const dish = useDish(item);
  const dishLabel = item.recipe_name || 'dish';

  return (
    <div
      className={cn(
        'rounded-lg hairline',
        item.is_highlight ? 'bg-surface-selected' : 'bg-card',
        isSelected && 'ring-1 ring-accent'
      )}
    >
      <div className={cn(LIST_COLUMNS, 'items-center gap-x-3 gap-y-2 px-3 py-2')}>
        <div className="flex items-center">
          <Checkbox
            checked={isSelected}
            onChange={onToggle}
            aria-label={`Select ${dishLabel} for a tasting session`}
            title="Select for a tasting session"
          />
          <DragHandle handle={dragHandleProps} label={`Reorder ${dishLabel}`} className="-mr-2 size-7" />
        </div>

        <div className="flex min-w-0 max-sm:col-span-3">
          <DishNameField item={item} recipes={recipes} save={dish.save} className="text-sm" />
        </div>

        <div className="min-w-0 max-sm:col-span-4">
          {item.recipe_id ? (
            <IngredientSearchInput item={item} recipeIngredients={dish.recipeIngredients} className="-ml-2" />
          ) : (
            <span className="text-sm text-tertiary">—</span>
          )}
        </div>

        <PriceField
          label="Sale price"
          value={item.sales_price}
          onCommit={(val) => dish.save({ sales_price: val })}
          className="max-sm:col-start-2"
        />
        <PriceField label="Cost price" value={item.cost_price} onCommit={(val) => dish.save({ cost_price: val })} />
        <CostPercent item={item} className="pr-1 text-right text-sm" />
      </div>

      <div className="flex flex-col gap-3 hairline-t px-4 py-3">
        <IngredientChips item={item} recipeIngredients={dish.recipeIngredients} />
        <DescriptionField item={item} save={dish.save} />
        <DishFooter
          item={item}
          dish={dish}
          unresolvedCount={unresolvedCount}
          onOpenComments={onOpenComments}
          showRemove
        />
      </div>

      <DishDialogs item={item} dish={dish} />
    </div>
  );
}
