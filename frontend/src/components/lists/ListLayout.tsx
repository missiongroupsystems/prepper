/**
 * Layout pieces shared by the catalogue and settings lists: the tab's own header under a page's
 * TabRail, the wrapping toolbar, the card grid (three columns at most) and the list stack, and
 * their loading and error states.
 */
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

const SKELETON_COUNT = 6;

/** A tab's heading under the page's SectionHeader + TabRail: an h2, one line, its actions. */
export function TabHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-lg leading-tight">{title}</h2>
        {description && <p className="max-w-[60ch] text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Search first and growing; the other controls wrap under it on a narrow screen. */
export function ListToolbar({ search, children }: { search: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[min(100%,16rem)] flex-1 sm:max-w-md">{search}</div>
      {children && <div className="flex flex-wrap items-center gap-x-4 gap-y-2">{children}</div>}
    </div>
  );
}

export const cardGridClasses = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

export function CardGrid({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(cardGridClasses, className)}>{children}</div>;
}

export function ListStack({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex w-full flex-col gap-2', className)}>{children}</div>;
}

export function ListSkeleton({ view }: { view: 'grid' | 'list' }) {
  const items = Array.from({ length: SKELETON_COUNT }, (_, i) => (
    <Skeleton key={i} className={view === 'grid' ? 'h-32 rounded-lg' : 'h-16 rounded-lg'} />
  ));
  return (
    <div role="status" aria-label="Loading">
      {view === 'grid' ? <CardGrid>{items}</CardGrid> : <ListStack>{items}</ListStack>}
    </div>
  );
}

export function ListError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-lg bg-danger-subtle p-4 text-sm text-danger">
      {children}
    </div>
  );
}

/** A titled group of cards or rows ("Active", "kg", a brand). */
export function ListGroup({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-baseline gap-2 border-b border-line pb-2 text-base">
        {title}
        {count !== undefined && <span className="text-sm text-tertiary tabular-nums">{count}</span>}
      </h3>
      {children}
    </section>
  );
}
