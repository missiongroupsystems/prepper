/**
 * Badge / status pill (§12.4). 999px, sentence case, 12px/500, tint background + matching text.
 * The ONLY place functional hues appear — never style a badge with the brand accent.
 *
 * - `neutral` (default): the sunken beige pill for plain tags, counts and units.
 * - Semantic: `success`, `warning`, `danger`, `info`.
 * - Status (Tier-2): `draft`, `pending`, `settled`, `attention`, `blocked`, `alt`.
 *
 * Pre-redesign names map on: `default` / `secondary` / `unit` → neutral, `destructive` → danger.
 */
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type StatusVariant = 'draft' | 'pending' | 'settled' | 'attention' | 'blocked' | 'alt';
export type SemanticVariant = 'success' | 'warning' | 'danger' | 'info';
type LegacyVariant = 'default' | 'secondary' | 'unit' | 'destructive';

export type BadgeVariant = 'neutral' | SemanticVariant | StatusVariant;

const variants: Record<BadgeVariant | LegacyVariant, string> = {
  neutral: 'bg-surface-sunken text-muted-foreground',
  default: 'bg-surface-sunken text-muted-foreground',
  secondary: 'bg-surface-sunken text-muted-foreground',
  unit: 'bg-surface-sunken text-muted-foreground',
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  danger: 'bg-danger-subtle text-danger',
  destructive: 'bg-danger-subtle text-danger',
  info: 'bg-info-subtle text-info',
  draft: 'status-draft',
  pending: 'status-pending',
  settled: 'status-settled',
  attention: 'status-attention',
  blocked: 'status-blocked',
  alt: 'status-alt',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant | LegacyVariant;
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
