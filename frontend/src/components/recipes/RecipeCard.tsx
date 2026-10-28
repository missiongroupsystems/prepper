'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ImagePlus } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Recipe } from '@/types';
import { RecipeStatusBadges, costPerPortion } from './recipeBadges';

const IMAGE_SIZE = 56;

interface RecipeCardProps {
  recipe: Recipe;
  costPerPortion?: number | null;
  isOwned?: boolean;
  href?: string;
  outletNames?: string[];
  categoryNames?: string[];
  allergenNames?: string[];
  matchedViaSubDish?: boolean;
}

function BadgeGroup({ label, names, variant }: { label: string; names: string[]; variant?: 'warning' }) {
  if (names.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-tertiary">{label}</p>
      <div className="flex flex-wrap gap-1">
        {names.map((name) => (
          <Badge key={name} variant={variant}>
            {formatDisplayName(name)}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export const RecipeCard = memo(function RecipeCard({
  recipe,
  costPerPortion: explicitCost,
  isOwned,
  href,
  outletNames = [],
  categoryNames = [],
  allergenNames = [],
  matchedViaSubDish,
}: RecipeCardProps) {
  const name = formatDisplayName(recipe.name);
  return (
    <Link href={href ?? `/recipes/${recipe.id}`} className="block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
      <Card interactive className="flex h-full flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h3 className="text-base leading-snug font-medium text-ink break-words">{name}</h3>
            <p className="text-sm text-muted-foreground tabular-nums">
              {recipe.yield_quantity} {recipe.yield_unit}
            </p>
          </div>
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt=""
              width={IMAGE_SIZE}
              height={IMAGE_SIZE}
              className="size-14 shrink-0 rounded-md object-cover"
            />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center rounded-md bg-surface-sunken text-placeholder">
              <ImagePlus className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <RecipeStatusBadges recipe={recipe} isOwned={isOwned} matchedViaSubDish={matchedViaSubDish} />
        </div>
        <BadgeGroup label="Outlets" names={outletNames} />
        <BadgeGroup label="Categories" names={categoryNames} />
        <BadgeGroup label="Allergens" names={allergenNames} variant="warning" />

        <p className="mt-auto flex items-baseline justify-between gap-2 border-t border-line pt-3 text-sm">
          <span className="text-muted-foreground">Cost per portion</span>
          <span className="font-medium text-ink tabular-nums">{costPerPortion(recipe, explicitCost)}</span>
        </p>
      </Card>
    </Link>
  );
});
