'use client';

import { Building2, FileDown, PieChart } from 'lucide-react';
import { Page, SectionHeader } from '@/components/app';
import {
  Button,
  Card,
  EmptyState,
  Select,
  Table,
  TableBody,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';

const ICON = { className: 'size-4', strokeWidth: 1.5, 'aria-hidden': 'true' } as const;
const PERIODS = [{ value: 'dec-2024', label: 'December 2024' }];
/** Placeholder figures until Atlas sales data is connected. */
const SUMMARY = [
  { label: 'Total sales', value: '$--,---' },
  { label: 'Total COGS', value: '$--,---' },
  { label: 'Gross margin', value: '--.-%' },
];
const COLUMNS = ['Sold', 'Revenue', 'COGS', 'Margin'];

export default function FinancePage() {
  return (
    <Page wide>
      <SectionHeader
        eyebrow="Finance"
        title="Finance reporting"
        description="Sales from the point of sale, combined with the cost of goods from your recipes."
        actions={
          <>
            <Select value={PERIODS[0].value} onChange={() => {}} options={PERIODS} className="w-44" disabled aria-label="Period" />
            <Button variant="secondary" disabled>
              <FileDown {...ICON} />
              Export
            </Button>
          </>
        }
      />

      <div role="status" className="flex gap-3 rounded-lg bg-warning-subtle p-4 text-warning">
        <Building2 className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <div>
          <p className="font-medium">Atlas integration required</p>
          <p className="mt-1 text-sm">
            Sales data comes from Atlas POS. Cost of goods and margins will show here once the integration is live.
          </p>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        {SUMMARY.map((figure) => (
          <Card key={figure.label} className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">{figure.label}</dt>
            <dd className="text-[30px] leading-tight font-medium tabular-nums text-tertiary">{figure.value}</dd>
            <dd className="text-xs text-tertiary">vs last month</dd>
          </Card>
        ))}
      </dl>

      <section className="flex flex-col gap-3" aria-labelledby="sales-by-recipe">
        <h2 id="sales-by-recipe" className="text-base font-medium text-ink">
          Sales and COGS by recipe
        </h2>
        <Table framed aria-labelledby="sales-by-recipe">
          <TableHeader>
            <TableRow>
              <TableHead>Recipe</TableHead>
              {COLUMNS.map((column) => (
                <TableHead key={column} numeric>
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty colSpan={COLUMNS.length + 1}>Recipe sales will appear once Atlas is connected</TableEmpty>
          </TableBody>
        </Table>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="margin-bandwidth">
        <div className="flex flex-col gap-1">
          <h2 id="margin-bandwidth" className="text-base font-medium text-ink">
            Margin bandwidth
          </h2>
          <p className="text-sm text-muted-foreground">
            The margin range per recipe across supplier prices, from best to worst case.
          </p>
        </div>
        <EmptyState icon={PieChart} title="No chart yet" description="This chart needs sales data from Atlas." />
      </section>
    </Page>
  );
}
