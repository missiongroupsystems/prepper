/**
 * One column of the R&D board: a titled list of cards with a count, and an EmptyState when the
 * column has nothing in it. Cards fill the column width.
 */
import { useId, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui';

interface KanbanColumnProps {
  icon: LucideIcon;
  title: string;
  /** Omit when the column can't count its cards up front. */
  count?: number;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  children: ReactNode;
}

export function KanbanColumn({ icon: Icon, title, count, isEmpty, emptyTitle, emptyDescription, children }: KanbanColumnProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4">
      <header className="flex items-center gap-2 border-b border-line pb-3">
        <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        <h2 id={headingId} className="text-base font-medium text-ink">
          {title}
        </h2>
        {count !== undefined && <Badge className="ml-auto text-[13px] tabular-nums">{count}</Badge>}
      </header>
      {isEmpty ? (
        <EmptyState icon={Icon} title={emptyTitle} description={emptyDescription} className="p-8" />
      ) : (
        <div className="flex flex-col gap-3">{children}</div>
      )}
    </section>
  );
}
