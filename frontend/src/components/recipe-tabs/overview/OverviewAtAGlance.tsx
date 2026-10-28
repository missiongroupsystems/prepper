'use client';

/** Ingredients, sub-recipes and costing side by side — a read-only summary of the other tabs. */
import { useCosting, useRecipes, useSubRecipes } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils';
import type { ReactNode } from 'react';
import type { Recipe, RecipeIngredient } from '@/types';
import { IngredientName } from '../IngredientName';
import { Fact, OverviewSection } from './OverviewSection';

const PERCENT = 100;

function QuantityList({ rows, empty }: { rows: { key: number; name: ReactNode; quantity: string }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-tertiary">{empty}</p>;
  return (
    <ul className="flex flex-col">
      {rows.map((row) => (
        <li key={row.key} className="flex items-baseline justify-between gap-4 border-b border-line py-2 text-sm last:border-b-0">
          <span className="min-w-0 text-ink">{row.name}</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">{row.quantity}</span>
        </li>
      ))}
    </ul>
  );
}

export function OverviewAtAGlance({
  recipe,
  ingredients,
}: {
  recipe: Recipe;
  ingredients: RecipeIngredient[];
}) {
  const { data: costing } = useCosting(recipe.id);
  const { data: subRecipes = [] } = useSubRecipes(recipe.id);
  const { data: allRecipesData } = useRecipes({ page_size: 30 });
  const recipeNames = new Map(allRecipesData?.items.map((r) => [r.id, r.name]));

  const margin =
    recipe.selling_price_est && costing?.cost_per_portion
      ? (1 - costing.cost_per_portion / recipe.selling_price_est) * PERCENT
      : null;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <OverviewSection title="Ingredients">
        <QuantityList
          empty="No ingredients yet"
          rows={ingredients.map((ri) => ({
            key: ri.id,
            name: <IngredientName name={ri.ingredient?.name ?? `Ingredient #${ri.ingredient_id}`} />,
            quantity: `${ri.quantity} ${ri.unit}`,
          }))}
        />
      </OverviewSection>

      <OverviewSection title="Sub-recipes">
        <QuantityList
          empty="No sub-recipes yet"
          rows={[...subRecipes]
            .sort((a, b) => a.position - b.position)
            .map((sr) => ({
              key: sr.id,
              name: recipeNames.get(sr.child_recipe_id) ?? `Recipe #${sr.child_recipe_id}`,
              quantity: `${sr.quantity} ${sr.unit}`,
            }))}
        />
      </OverviewSection>

      <OverviewSection title="Costing">
        {costing ? (
          <dl className="flex flex-col gap-4">
            <Fact label="Cost per portion">
              <span className="text-xl font-medium tabular-nums">{formatCurrency(costing.cost_per_portion)}</span>
            </Fact>
            <Fact label="Batch cost">
              <span className="tabular-nums">{formatCurrency(costing.total_batch_cost)}</span>
            </Fact>
            {margin !== null && (
              <Fact label="Margin">
                <span className="tabular-nums text-success">{margin.toFixed(1)}%</span>
              </Fact>
            )}
          </dl>
        ) : (
          <p className="text-sm text-tertiary">Nothing to cost yet</p>
        )}
      </OverviewSection>
    </div>
  );
}
