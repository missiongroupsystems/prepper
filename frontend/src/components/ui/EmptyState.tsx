/**
 * EmptyState (§12.8) — calm and centred: a thin-line icon, one line saying what is not here, an
 * optional line saying why or what to do, and the action that fixes it. `bare` drops the card
 * for use inside an existing surface (a table cell, a panel body).
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  bare,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  bare?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 text-center',
        bare ? 'px-4 py-10' : 'rounded-lg bg-card p-10 hairline',
        className
      )}
    >
      {Icon && <Icon className="mb-1 size-9 text-placeholder" strokeWidth={1.25} aria-hidden="true" />}
      <p className="text-base font-medium text-ink">{title}</p>
      {description && <p className="max-w-[42ch] text-sm text-tertiary">{description}</p>}
      {action && <div className="mt-3 flex items-center gap-2">{action}</div>}
    </div>
  );
}
