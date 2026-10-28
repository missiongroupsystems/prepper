'use client';

/**
 * List view of the staged items: one row per item — the name, meta and row menu on top, the
 * controls on a line beneath, so every row reads the same however long its name is.
 */
import { useRecipeIngredients, useSubRecipes } from '@/lib/hooks';
import { formatDisplayName } from '@/lib/format/displayName';
import { formatCurrency } from '@/lib/utils';
import type { Recipe, SupplierIngredient } from '@/types';
import { DisplayName, LineCost, QuantityStepper, RowActions, SupplierSelect, UnitSelect, WastageInput } from './StagedControls';
import type { StagedIngredient, StagedRecipe } from './types';
import { itemLabel } from './canvasModel';

const rowClasses = 'rounded-lg bg-card px-4 py-3 hairline transition-colors hover:border-input';

export function StagedIngredientRow({
  staged,
  suppliers,
  categoryMap,
  onRemove,
  onQuantityChange,
  onWastageChange,
  onUnitChange,
  onSupplierSelect,
}: {
  staged: StagedIngredient;
  suppliers: SupplierIngredient[];
  categoryMap: Record<number, string>;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
  onWastageChange: (wastage: number) => void;
  onUnitChange: (unit: string) => void;
  onSupplierSelect: (supplierId: number | null) => void;
}) {
  const name = itemLabel(staged.ingredient.name);
  const categoryName = staged.ingredient.category_id ? categoryMap[staged.ingredient.category_id] : null;

  return (
    <div className={rowClasses}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <DisplayName name={staged.ingredient.name} className="text-sm font-medium text-ink" />
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-tertiary">
            <span>{staged.unit}</span>
            {categoryName && (
              <>
                <span aria-hidden="true">·</span>
                <span>{categoryName}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <LineCost quantity={staged.quantity} unitPrice={staged.unitPrice} unit={staged.unit} />
          </div>
        </div>
        <RowActions itemName={name} onRemove={onRemove} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <QuantityStepper value={staged.quantity} onChange={onQuantityChange} itemName={name} />
        <UnitSelect unit={staged.unit} onChange={onUnitChange} itemName={name} />
        <WastageInput value={staged.wastage_percentage} onChange={onWastageChange} itemName={name} />
        {suppliers.length > 0 && (
          <SupplierSelect
            supplierId={staged.selectedSupplierId}
            suppliers={suppliers}
            onChange={onSupplierSelect}
            itemName={name}
            className="w-56"
          />
        )}
      </div>
    </div>
  );
}

export function StagedRecipeRow({
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
  const { data: recipeIngredients } = useRecipeIngredients(staged.recipe.id);
  const { data: subRecipes } = useSubRecipes(staged.recipe.id);
  const name = itemLabel(staged.recipe.name);
  const hasDetail =
    (recipeIngredients && recipeIngredients.length > 0) || (subRecipes && subRecipes.length > 0) || categoryNames.length > 0;

  return (
    <div className={rowClasses}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <DisplayName name={staged.recipe.name} className="text-sm font-medium text-ink" />
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-tertiary">
            <span>
              {staged.recipe.yield_quantity} {staged.recipe.yield_unit}
            </span>
            {outletNames.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{outletNames.join(', ')}</span>
              </>
            )}
          </div>
        </div>
        <RowActions itemName={name} onRemove={onRemove} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <QuantityStepper value={staged.quantity} onChange={onQuantityChange} itemName={name} />
        <span className="text-sm text-tertiary">portion</span>
      </div>

      {hasDetail && (
        <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
          {categoryNames.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {categoryNames.map((label) => (
                <span key={label} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {label}
                </span>
              ))}
            </div>
          )}
          {recipeIngredients && recipeIngredients.length > 0 && (
            <ul className="space-y-1 text-muted-foreground">
              {recipeIngredients.map((ri) => (
                <li key={ri.id} className="flex justify-between gap-2">
                  <span className="min-w-0">
                    {formatDisplayName(ri.ingredient?.name || `#${ri.ingredient_id}`)} · {ri.quantity} {ri.base_unit || ri.unit}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {ri.unit_price != null ? (
                      <>
                        {formatCurrency(ri.quantity * ri.unit_price)} (${ri.unit_price.toFixed(2)})
                      </>
                    ) : (
                      '—'
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {subRecipes && subRecipes.length > 0 && (
            <ul className="space-y-1 text-muted-foreground">
              {subRecipes.map((sr) => {
                const child = allRecipes?.find((r) => r.id === sr.child_recipe_id);
                return (
                  <li key={sr.id} className="flex justify-between gap-2">
                    <span>{formatDisplayName(child?.name || `Recipe #${sr.child_recipe_id}`)}</span>
                    <span className="tabular-nums">
                      {sr.quantity} {sr.unit}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
