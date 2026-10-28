/** One titled card on the Overview tab: an h2, optional actions on the right, then the body. */
import { useId, type ReactNode } from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

export function OverviewSection({
  title,
  actions,
  className,
  children,
}: {
  title: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <Card className={cn('flex flex-col gap-4', className)} aria-labelledby={headingId} role="region">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="text-base font-medium text-ink">
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </Card>
  );
}

/** A label above its value — the Overview's facts read as a form, not a run of "Key: value" lines. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs font-medium text-tertiary">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}
