/**
 * Table (§12.3). A real `<table>` — money and quantities need column alignment a card-row list
 * cannot give — dressed as a lifted surface: `framed` draws the 12px hairline card, a beige
 * header row carries 12px/500 secondary labels, rows are separated by quiet lines, and rows that
 * do something get a hover. `numeric` cells are right-aligned tabular figures (Satoshi, never a
 * monospace) so costs line up to the cent. The wrapper scrolls horizontally on narrow screens.
 */
import type { HTMLAttributes, ReactNode, TableHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** Draw the lifted card frame around the table — callers stop wrapping it in a Card. */
  framed?: boolean;
  /** `compact` is for a dense grid, never a form. */
  density?: 'comfortable' | 'compact';
}

export function Table({ className, framed, density = 'comfortable', ...props }: TableProps) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto',
        framed && 'rounded-lg bg-card hairline',
        density === 'compact' && '[&_td]:py-1.5 [&_th]:py-1.5'
      )}
    >
      <table className={cn('w-full min-w-full text-left', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('border-b border-hairline bg-surface-sunken/70', className)} {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TableFooter({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={cn('border-t border-hairline font-medium', className)} {...props} />;
}

interface RowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** The row opens or expands something — pointer cursor and a hover fill. */
  interactive?: boolean;
  selected?: boolean;
}

export function TableRow({ className, interactive, selected, ...props }: RowProps) {
  return (
    <tr
      className={cn(
        'border-b border-line last:border-b-0',
        interactive && 'cursor-pointer transition-colors duration-(--dur-quick) hover:bg-surface-hover',
        selected && 'bg-surface-selected',
        className
      )}
      {...props}
    />
  );
}

interface CellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /** Right-align with tabular figures — for money, quantities, counts. */
  numeric?: boolean;
}

export function TableHead({ className, numeric, ...props }: CellProps) {
  return (
    <th
      className={cn(
        'px-4 py-2 text-xs font-medium whitespace-nowrap text-muted-foreground',
        numeric && 'text-right tabular-nums',
        className
      )}
      {...props}
    />
  );
}

/** No weight class on purpose: body is 400 already, and leaving it unset lets a caller's emphasis win. */
export function TableCell({ className, numeric, ...props }: CellProps) {
  return (
    <td
      className={cn('px-4 py-2.5 text-sm text-ink', numeric && 'text-right tabular-nums whitespace-nowrap', className)}
      {...props}
    />
  );
}

/** The one empty row a table renders when it has nothing — spans every column. */
export function TableEmpty({
  colSpan,
  children,
  className,
}: {
  colSpan: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className={cn('px-4 py-10 text-center text-sm text-tertiary', className)}>
        {children}
      </td>
    </tr>
  );
}
