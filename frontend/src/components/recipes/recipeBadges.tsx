/** The status and flag badges a dish carries on its card and its list row. */
import { Badge, type BadgeVariant } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { Recipe, RecipeStatus } from '@/types';

const STATUS: Record<RecipeStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'draft' },
  active: { label: 'Active', variant: 'success' },
  archived: { label: 'Archived', variant: 'warning' },
};

export function RecipeStatusBadges({
  recipe,
  isOwned,
  matchedViaSubDish,
}: {
  recipe: Recipe;
  isOwned?: boolean;
  matchedViaSubDish?: boolean;
}) {
  const status = STATUS[recipe.status];
  return (
    <>
      <Badge variant={status.variant}>{status.label}</Badge>
      {recipe.is_prep_recipe && <Badge>Prep</Badge>}
      {matchedViaSubDish && <Badge variant="info">Via sub-dish</Badge>}
      {isOwned && <Badge variant="info">Yours</Badge>}
    </>
  );
}

/** Cost per portion: an explicit figure, else the recipe cost over its yield. */
export function costPerPortion(recipe: Recipe, explicit?: number | null): string {
  if (explicit != null) return formatCurrency(explicit);
  if (recipe.cost_price != null && recipe.yield_quantity > 0) return formatCurrency(recipe.cost_price / recipe.yield_quantity);
  return formatCurrency(recipe.cost_price);
}
