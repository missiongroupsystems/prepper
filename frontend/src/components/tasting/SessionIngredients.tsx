/**
 * Every ingredient across the session's dishes, alphabetical, each linking to its own tasting
 * page and showing which dishes use it.
 */
import Link from 'next/link';
import { Carrot } from 'lucide-react';
import { Badge, EmptyState, EntityCode, Skeleton } from '@/components/ui';
import { displayNameParts, formatDisplayName } from '@/lib/format/displayName';
import type { RecipeTasting } from '@/types';

export interface DerivedIngredient {
  id: number;
  name: string;
  base_unit: string;
  recipe_names: string[];
}

/** Unique ingredients across the dishes, each with the dishes that use it. */
export function deriveSessionIngredients(sessionRecipes: RecipeTasting[] | undefined): DerivedIngredient[] {
  const byId = new Map<number, DerivedIngredient>();
  for (const sr of sessionRecipes ?? []) {
    const recipeName = sr.recipe_name || `Recipe #${sr.recipe_id}`;
    for (const ing of sr.ingredients || []) {
      const existing = byId.get(ing.id);
      if (!existing) {
        byId.set(ing.id, { id: ing.id, name: ing.name, base_unit: ing.base_unit, recipe_names: [recipeName] });
      } else if (!existing.recipe_names.includes(recipeName)) {
        existing.recipe_names.push(recipeName);
      }
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function SessionIngredients({
  sessionId,
  ingredients,
  isLoading,
}: {
  sessionId: number;
  ingredients: DerivedIngredient[];
  isLoading: boolean;
}) {
  return (
    <section aria-labelledby="session-ingredients-heading" className="flex flex-col gap-4">
      <h2 id="session-ingredients-heading" className="flex items-center gap-2 text-lg font-medium text-ink">
        <Carrot className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        Ingredients
        {ingredients.length > 0 && <Badge className="text-[13px] tabular-nums">{ingredients.length}</Badge>}
      </h2>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      )}

      {!isLoading && ingredients.length === 0 && (
        <EmptyState icon={Carrot} title="No ingredients yet" description="Add dishes to see their ingredients here." />
      )}

      {!isLoading && ingredients.length > 0 && (
        <ul className="flex flex-col divide-y divide-line rounded-lg bg-card hairline">
          {ingredients.map((item) => {
            const { code, name } = displayNameParts(item.name);
            return (
              <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-col gap-1.5">
                  {code && <EntityCode>{code}</EntityCode>}
                  <Link
                    href={`/tastings/${sessionId}/i/${item.id}`}
                    className="text-[15px] font-medium text-ink hover:underline"
                  >
                    {name}
                  </Link>
                  <div className="flex flex-wrap gap-1.5">
                    {item.recipe_names.map((rn) => (
                      <Badge key={rn} className="text-[13px]">
                        {formatDisplayName(rn)}
                      </Badge>
                    ))}
                  </div>
                </div>
                {item.base_unit && <Badge className="shrink-0 text-[13px]">{item.base_unit}</Badge>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
