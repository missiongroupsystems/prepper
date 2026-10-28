/**
 * Phone stacking for the catalogue tables. From `sm` up these are ordinary `Table` rows; below it
 * each row becomes a card-like block: the first cell is the row's title, every other cell shows
 * its column label on the left and its value on the right, and the actions cell pins top-right.
 */
import type { ReactNode } from 'react';
import { TableCell, TableHead } from '@/components/ui';
import { cn } from '@/lib/utils';

export const stackedTableClasses = 'block sm:table';
export const stackedHeaderClasses = 'hidden sm:table-header-group';
export const stackedBodyClasses = 'block sm:table-row-group';
export const stackedRowClasses = 'relative flex flex-col py-2 sm:table-row sm:py-0';

/** The row's title cell; leaves room on phones for the pinned actions. */
export function StackedTitleCell({ className, children }: { className?: string; children: ReactNode }) {
  return <TableCell className={cn('block pr-14 font-medium sm:table-cell sm:pr-4', className)}>{children}</TableCell>;
}

export function StackedCell({
  label,
  numeric,
  className,
  children,
}: {
  label: string;
  numeric?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <TableCell
      numeric={numeric}
      className={cn('flex min-h-9 items-center justify-between gap-4 py-1 sm:table-cell sm:min-h-0 sm:py-2.5', className)}
    >
      <span className="text-muted-foreground sm:hidden">{label}</span>
      {children}
    </TableCell>
  );
}

export function StackedActionsCell({ children }: { children: ReactNode }) {
  return <TableCell className="absolute top-1 right-1 p-0 sm:static sm:w-12 sm:px-2 sm:py-1">{children}</TableCell>;
}

/** Empty header cell over the actions column, named for screen readers. */
export function ActionsHead() {
  return (
    <TableHead className="w-12">
      <span className="sr-only">Actions</span>
    </TableHead>
  );
}
