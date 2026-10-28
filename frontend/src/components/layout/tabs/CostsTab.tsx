'use client';

import { Calculator, TriangleAlert } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { useRecipe, useCosting, useRecipes } from '@/lib/hooks';
import { SectionHeader } from '@/components/app';
import { Card, EmptyState, Skeleton } from '@/components/ui';
import { RecipeTabPage, RecipeTabState } from '@/components/recipe-tabs/RecipeTabPage';
import { IngredientCostTable, SubRecipeCostTable } from '@/components/recipe-tabs/CostTables';
import { formatDisplayName } from '@/lib/format/displayName';
import { formatCurrency } from '@/lib/utils';
import type { CostingResult } from '@/types';

function SummaryFigure({ label, value, hint }: { label: string; value: number | null; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-tertiary">{label}</dt>
      <dd className="text-xl font-medium tabular-nums text-ink">{formatCurrency(value)}</dd>
      {hint && <dd className="text-xs text-tertiary">{hint}</dd>}
    </div>
  );
}

function CostSummary({ costing }: { costing: CostingResult }) {
  const hasSubRecipes = costing.sub_recipe_cost != null && costing.sub_recipe_cost > 0;
  return (
    <Card>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <SummaryFigure label="Cost per portion" value={costing.cost_per_portion} hint={`Batch ÷ ${costing.yield_quantity} ${costing.yield_unit}`} />
        <SummaryFigure label="Batch cost" value={costing.total_batch_cost} />
        <SummaryFigure label="Ingredients" value={costing.ingredient_cost} />
        {hasSubRecipes && <SummaryFigure label="Sub-recipes" value={costing.sub_recipe_cost} />}
      </dl>
    </Card>
  );
}

function MissingCosts({ names }: { names: string[] }) {
  return (
    <div role="status" className="flex gap-3 rounded-lg bg-warning-subtle p-4 text-warning">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <div className="text-sm">
        <p className="font-medium">No price yet for {names.length === 1 ? 'one ingredient' : `${names.length} ingredients`}</p>
        <p className="mt-1">{names.map(formatDisplayName).join(', ')}</p>
      </div>
    </div>
  );
}

function CostBreakdown({ recipeId }: { recipeId: number }) {
  const { data: costing, isLoading, error } = useCosting(recipeId);
  const { data: recipesData } = useRecipes({ page_size: 30 });

  if (isLoading) return <Skeleton className="h-64 rounded-lg" />;

  // The costing endpoint 404s for a recipe with nothing in it, so an error reads as empty.
  const isEmpty = error || !costing || (costing.breakdown.length === 0 && costing.sub_recipe_breakdown.length === 0);
  if (isEmpty) {
    return (
      <EmptyState
        icon={Calculator}
        title="Nothing to cost yet"
        description="Add ingredients on the canvas tab and their costs, with wastage, will add up here."
      />
    );
  }

  const recipesById = new Map(recipesData?.items.map((r) => [r.id, r]));
  return (
    <>
      <CostSummary costing={costing} />
      {costing.missing_costs.length > 0 && <MissingCosts names={costing.missing_costs} />}
      <section className="flex flex-col gap-3" aria-labelledby="ingredient-costs">
        <h2 id="ingredient-costs" className="text-base font-medium text-ink">
          Ingredients
        </h2>
        <IngredientCostTable costing={costing} />
      </section>
      {costing.sub_recipe_breakdown.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="sub-recipe-costs">
          <h2 id="sub-recipe-costs" className="text-base font-medium text-ink">
            Sub-recipes
          </h2>
          <SubRecipeCostTable costing={costing} recipesById={recipesById} />
        </section>
      )}
    </>
  );
}

export function CostsTab() {
  const { selectedRecipeId } = useAppState();
  const { data: recipe, isLoading, error } = useRecipe(selectedRecipeId);

  const subject = 'its costs';
  if (!selectedRecipeId) return <RecipeTabState state="unselected" subject={subject} icon={Calculator} />;
  if (isLoading) return <RecipeTabState state="loading" subject={subject} />;
  if (error || !recipe) return <RecipeTabState state="error" subject={subject} icon={Calculator} />;

  return (
    <RecipeTabPage>
      <SectionHeader
        eyebrow={recipe.name}
        title="Costs"
        description="Ingredient and sub-recipe costs for one batch, with wastage factored in."
      />
      <CostBreakdown recipeId={recipe.id} />
    </RecipeTabPage>
  );
}
