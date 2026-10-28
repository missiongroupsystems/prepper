/**
 * Small display pieces shared by the R&D board and the R&D recipe page: the status pill, the
 * recipe thumbnail and the per-portion cost line.
 */
import Image from 'next/image';
import { ImagePlus } from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import { cn, formatCurrency } from '@/lib/utils';
import type { Recipe, RecipeStatus } from '@/types';

const STATUS_VARIANTS: Record<RecipeStatus, BadgeVariant> = {
  draft: 'draft',
  active: 'success',
  archived: 'warning',
};

export function RecipeStatusBadge({ status }: { status: RecipeStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className="text-[13px]">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function RecipeThumb({ recipe, size = 'md' }: { recipe: Recipe; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'size-24 md:size-32' : 'size-14';
  if (recipe.image_url) {
    return (
      <Image
        src={recipe.image_url}
        alt={formatDisplayName(recipe.name)}
        width={size === 'lg' ? 128 : 56}
        height={size === 'lg' ? 128 : 56}
        className={cn(box, 'shrink-0 rounded-md object-cover')}
      />
    );
  }
  return (
    <div className={cn(box, 'flex shrink-0 items-center justify-center rounded-md bg-surface-sunken text-placeholder')}>
      <ImagePlus className={size === 'lg' ? 'size-8' : 'size-5'} strokeWidth={1.5} aria-hidden="true" />
    </div>
  );
}

export function PortionCost({ value }: { value: number | null | undefined }) {
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium text-ink tabular-nums">{formatCurrency(value)}</span> per portion
    </p>
  );
}
