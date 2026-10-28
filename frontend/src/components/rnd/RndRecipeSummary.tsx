/**
 * The dish at a glance on its R&D page: photo, yield, the outlets, categories and allergens it
 * carries, when it was made and changed, and its description.
 */
import { Badge, Card } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Allergen, Outlet, Recipe, RecipeCategory, RecipeOutlet, RecipeRecipeCategory } from '@/types';
import { RecipeThumb } from './recipeDisplay';

interface RndRecipeSummaryProps {
  recipe: Recipe;
  outlets: RecipeOutlet[] | undefined;
  outletMap: Map<number, Outlet>;
  categoryLinks: RecipeRecipeCategory[];
  allCategories: RecipeCategory[];
  allergens: Allergen[];
}

export function RndRecipeSummary({ recipe, outlets, outletMap, categoryLinks, allCategories, allergens }: RndRecipeSummaryProps) {
  const hasTags = (outlets?.length ?? 0) > 0 || categoryLinks.length > 0 || allergens.length > 0;
  return (
    <Card className="flex flex-col gap-5 sm:flex-row sm:items-start">
      <RecipeThumb recipe={recipe} size="lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <dt className="text-[13px] font-medium text-muted-foreground">Yield</dt>
            <dd className="text-ink tabular-nums">
              {recipe.yield_quantity} {recipe.yield_unit}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-[13px] font-medium text-muted-foreground">Created</dt>
            <dd className="text-ink tabular-nums">{new Date(recipe.created_at).toLocaleDateString()}</dd>
          </div>
          {recipe.updated_at !== recipe.created_at && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-[13px] font-medium text-muted-foreground">Updated</dt>
              <dd className="text-ink tabular-nums">{new Date(recipe.updated_at).toLocaleDateString()}</dd>
            </div>
          )}
        </dl>

        {hasTags && (
          <div className="flex flex-wrap gap-1.5">
            {outlets?.map((recipeOutlet) => {
              const outlet = outletMap.get(recipeOutlet.outlet_id);
              return (
                <Badge key={recipeOutlet.outlet_id} className="text-[13px]">
                  {outlet?.code || `Outlet #${recipeOutlet.outlet_id}`}
                </Badge>
              );
            })}
            {categoryLinks.map((link) => {
              const category = allCategories.find((c) => c.id === link.category_id);
              return category ? (
                <Badge key={link.id} variant="info" className="text-[13px]">
                  {formatDisplayName(category.name)}
                </Badge>
              ) : null;
            })}
            {allergens.map((allergen) => (
              <Badge key={allergen.id} variant="warning" className="text-[13px]">
                {allergen.name}
              </Badge>
            ))}
          </div>
        )}

        {recipe.description && (
          <p className="max-w-[65ch] border-t border-line pt-4 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {recipe.description}
          </p>
        )}
      </div>
    </Card>
  );
}
