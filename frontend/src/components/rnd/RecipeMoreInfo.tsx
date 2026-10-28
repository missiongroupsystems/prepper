/**
 * The dish's working detail, collapsed by default: ingredients, sub-recipes, costing and the
 * method.
 */
import type { ReactNode } from 'react';
import { Clock, Thermometer } from 'lucide-react';
import { EntityCode } from '@/components/ui';
import { displayNameParts, formatDisplayName } from '@/lib/format/displayName';
import { formatCurrency, formatTimer } from '@/lib/utils';
import type { CostingResult, Recipe, RecipeIngredient, SubRecipe } from '@/types';
import { CollapsibleSection } from './CollapsibleSection';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="text-[15px] font-medium text-ink">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value, code }: { label: string; value: ReactNode; code?: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-2 text-sm">
      <span className="min-w-0">
        {code && <EntityCode>{code}</EntityCode>}
        <span className="text-ink">{label}</span>
      </span>
      <span className="shrink-0 text-muted-foreground tabular-nums">{value}</span>
    </li>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-muted-foreground">{children}</p>;

interface RecipeMoreInfoProps {
  recipe: Recipe;
  ingredients: RecipeIngredient[] | undefined;
  costing: CostingResult | undefined;
  subRecipes: SubRecipe[] | undefined;
  recipeNames: Map<number, string>;
}

export function RecipeMoreInfo({ recipe, ingredients, costing, subRecipes, recipeNames }: RecipeMoreInfoProps) {
  const steps = recipe.instructions_structured?.steps ?? [];
  return (
    <CollapsibleSection title="More info">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Group title="Ingredients">
            {ingredients && ingredients.length > 0 ? (
              <ul className="divide-y divide-line">
                {ingredients.map((ri) => {
                  const { code, name } = ri.ingredient
                    ? displayNameParts(ri.ingredient.name)
                    : { code: undefined, name: `Ingredient #${ri.ingredient_id}` };
                  return <Row key={ri.id} code={code} label={name} value={`${ri.quantity} ${ri.unit}`} />;
                })}
              </ul>
            ) : (
              <Empty>No ingredients added yet</Empty>
            )}
          </Group>

          <Group title="Sub-recipes">
            {subRecipes && subRecipes.length > 0 ? (
              <ul className="divide-y divide-line">
                {[...subRecipes]
                  .sort((a, b) => a.position - b.position)
                  .map((sr) => {
                    const name = recipeNames.get(sr.child_recipe_id);
                    return (
                      <Row
                        key={sr.id}
                        label={name ? formatDisplayName(name) : `Recipe #${sr.child_recipe_id}`}
                        value={`${sr.quantity} ${sr.unit}`}
                      />
                    );
                  })}
              </ul>
            ) : (
              <Empty>No sub-recipes added yet</Empty>
            )}
          </Group>

          <Group title="Costing">
            {costing ? (
              <ul className="divide-y divide-line">
                <Row label="Batch cost" value={formatCurrency(costing.total_batch_cost)} />
                <Row
                  label="Cost per portion"
                  value={<span className="font-medium text-ink">{formatCurrency(costing.cost_per_portion)}</span>}
                />
                {recipe.selling_price_est && costing.cost_per_portion ? (
                  <Row
                    label="Margin"
                    value={
                      <span className="text-success">
                        {((1 - costing.cost_per_portion / recipe.selling_price_est) * 100).toFixed(1)}%
                      </span>
                    }
                  />
                ) : null}
              </ul>
            ) : (
              <Empty>No costing data available</Empty>
            )}
          </Group>
        </div>

        <div className="border-t border-line pt-6">
          <Group title="Method">
            {steps.length > 0 ? (
              <ol className="flex flex-col gap-4">
                {steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-sm font-medium text-muted-foreground tabular-nums">
                      {step.order || index + 1}
                    </span>
                    <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
                      <p className="text-sm leading-relaxed text-ink">{step.text}</p>
                      {(step.timer_seconds || step.temperature_c) && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground tabular-nums">
                          {step.timer_seconds ? (
                            <span className="flex items-center gap-1">
                              <Clock className="size-4" strokeWidth={1.5} aria-hidden="true" />
                              {formatTimer(step.timer_seconds)}
                            </span>
                          ) : null}
                          {step.temperature_c ? (
                            <span className="flex items-center gap-1">
                              <Thermometer className="size-4" strokeWidth={1.5} aria-hidden="true" />
                              {step.temperature_c}°C
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : recipe.instructions_raw ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink">{recipe.instructions_raw}</p>
            ) : (
              <Empty>No instructions added yet</Empty>
            )}
          </Group>
        </div>
      </div>
    </CollapsibleSection>
  );
}
