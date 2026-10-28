'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Badge, Card } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Recipe } from '@/types';
import { RecipeStatusBadges, costPerPortion } from './recipeBadges';

interface RecipeListRowProps {
  recipe: Recipe;
  costPerPortion?: number | null;
  isOwned?: boolean;
  href?: string;
  allergenNames?: string[];
  categoryNames?: string[];
  matchedViaSubDish?: boolean;
}

export const RecipeListRow = memo(function RecipeListRow({
  recipe,
  costPerPortion: explicitCost,
  isOwned,
  href,
  allergenNames = [],
  categoryNames = [],
  matchedViaSubDish,
}: RecipeListRowProps) {
  return (
    <Link href={href ?? `/recipes/${recipe.id}`} className="block rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
      <Card interactive className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
          <h3 className="text-base leading-snug font-medium text-ink break-words">{formatDisplayName(recipe.name)}</h3>
          <p className="text-sm text-muted-foreground tabular-nums">
            {recipe.yield_quantity} {recipe.yield_unit}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <RecipeStatusBadges recipe={recipe} isOwned={isOwned} matchedViaSubDish={matchedViaSubDish} />
          {categoryNames.map((name) => (
            <Badge key={name}>{formatDisplayName(name)}</Badge>
          ))}
          {allergenNames.map((name) => (
            <Badge key={name} variant="warning">
              {formatDisplayName(name)}
            </Badge>
          ))}
        </div>
        <p className="ml-auto text-sm whitespace-nowrap tabular-nums">
          <span className="font-medium text-ink">{costPerPortion(recipe, explicitCost)}</span>
          <span className="text-muted-foreground"> per portion</span>
        </p>
      </Card>
    </Link>
  );
});
