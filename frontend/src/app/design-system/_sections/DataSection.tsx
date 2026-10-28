'use client';

import { useState } from 'react';
import { BookOpen, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Menu,
  MenuItem,
  MenuSeparator,
  Pagination,
  Skeleton,
  SkeletonRows,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  type BadgeVariant,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { Section, Subsection } from './primitives';

const ROWS: { name: string; status: string; tone: BadgeVariant; yieldQty: number; cost: number }[] = [
  { name: 'Beef bourguignon', status: 'Approved', tone: 'settled', yieldQty: 10, cost: 124.5 },
  { name: 'Brown butter', status: 'Testing', tone: 'pending', yieldQty: 1, cost: 6.2 },
  { name: 'Pickled shallots', status: 'Draft', tone: 'draft', yieldQty: 24, cost: 18.75 },
];

const ICON = { className: 'size-4', strokeWidth: 1.5, 'aria-hidden': true } as const;

function RowActions({ name }: { name: string }) {
  return (
    <Menu
      label={`${name} actions`}
      trigger={(props) => (
        <Button variant="ghost" size="icon-sm" aria-label={`${name} actions`} {...props}>
          <MoreHorizontal {...ICON} />
        </Button>
      )}
    >
      <MenuItem icon={Pencil}>Edit</MenuItem>
      <MenuItem icon={BookOpen}>Open costing</MenuItem>
      <MenuSeparator />
      <MenuItem icon={Trash2} danger>
        Delete
      </MenuItem>
    </Menu>
  );
}

/** Tables, empty and loading states. */
export function DataSection() {
  const [page, setPage] = useState(1);

  return (
    <>
      <Section title="Table">
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          <code className="font-mono text-xs">framed</code> draws the card; numeric cells are right-aligned
          tabular figures; interactive rows hover; row actions live in a Menu.
        </p>
        <Subsection title="Framed, with row actions">
          <Table framed>
            <TableHeader>
              <TableRow>
                <TableHead>Recipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead numeric>Yield</TableHead>
                <TableHead numeric>Cost</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((row, i) => (
                <TableRow key={row.name} interactive selected={i === 1}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    <Badge variant={row.tone}>{row.status}</Badge>
                  </TableCell>
                  <TableCell numeric>{row.yieldQty}</TableCell>
                  <TableCell numeric>{formatCurrency(row.cost)}</TableCell>
                  <TableCell className="py-1 text-right">
                    <RowActions name={row.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination pageNumber={page} totalPages={4} totalCount={38} currentPageSize={10} onPageChange={setPage} />
        </Subsection>
        <Subsection title="Compact, empty">
          <Table framed density="compact">
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead numeric>Wastage</TableHead>
                <TableHead numeric>Adjusted cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty colSpan={3}>No ingredients yet.</TableEmpty>
            </TableBody>
          </Table>
        </Subsection>
      </Section>

      <Section title="Empty and loading states">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Subsection title="Empty state">
            <EmptyState
              icon={BookOpen}
              title="No recipes yet"
              description="Start a recipe from scratch or fork one from another outlet."
              action={
                <Button>
                  <Plus {...ICON} />
                  New recipe
                </Button>
              }
            />
          </Subsection>
          <Subsection title="Skeleton">
            <div className="space-y-4 rounded-lg bg-card p-5 hairline">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <SkeletonRows rows={3} className="p-0" />
            </div>
          </Subsection>
          <Subsection title="Spinner (in-control only)">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Spinner />
              Recalculating costs…
            </div>
          </Subsection>
        </div>
      </Section>
    </>
  );
}
