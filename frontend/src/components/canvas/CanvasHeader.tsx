'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, Checkbox, Input, Label, NumericInput, Select } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
import type { RecipeStatus } from '@/types';
import type { RecipeMetadata } from './types';

/** A per-portion profit within half a cent is break-even, not a profit or a loss. */
const BREAK_EVEN_TOLERANCE = 0.005;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

const chipClasses = 'rounded-full bg-secondary px-2.5 py-1 text-sm font-medium tabular-nums text-muted-foreground';

/** Batch cost, cost per portion, selling price and profit per portion — each once it is known. */
function CostSummary({ canvasCost, metadata }: { canvasCost: number; metadata: RecipeMetadata }) {
  const hasYield = canvasCost > 0 && metadata.yield_quantity > 0;
  const costPerPortion = hasYield ? canvasCost / metadata.yield_quantity : 0;
  const profit = metadata.selling_price - costPerPortion;
  const isProfit = profit > BREAK_EVEN_TOLERANCE;
  const isLoss = profit < -BREAK_EVEN_TOLERANCE;

  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Cost summary">
      {canvasCost > 0 && <li className={chipClasses}>Batch {formatCurrency(canvasCost)}</li>}
      {hasYield && (
        <li className={chipClasses}>
          {formatCurrency(costPerPortion)}/{metadata.yield_unit}
        </li>
      )}
      {metadata.selling_price > 0 && <li className={chipClasses}>Sell {formatCurrency(metadata.selling_price)}</li>}
      {hasYield && metadata.selling_price > 0 && (
        <li
          className={cn(
            chipClasses,
            isProfit && 'bg-success-subtle text-success',
            isLoss && 'bg-danger-subtle text-danger'
          )}
        >
          {isProfit ? '+' : ''}
          {formatCurrency(profit)}/{metadata.yield_unit}
        </li>
      )}
    </ul>
  );
}

/** The recipe's details as a labelled grid: yield, price, status, visibility. */
function CanvasDetails({
  metadata,
  onMetadataChange,
}: {
  metadata: RecipeMetadata;
  onMetadataChange: (updates: Partial<RecipeMetadata>) => void;
}) {
  const id = useId();
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-yield`}>Yield</Label>
        <div className="flex gap-2">
          <NumericInput
            id={`${id}-yield`}
            value={metadata.yield_quantity}
            onChange={(v) => onMetadataChange({ yield_quantity: v })}
            min={0}
            className="w-24"
          />
          <Input
            aria-label="Yield unit"
            value={metadata.yield_unit}
            onChange={(e) => onMetadataChange({ yield_unit: e.target.value })}
            placeholder="unit"
            className="min-w-0 flex-1"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-price`}>Selling price</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-tertiary">$</span>
          <NumericInput
            id={`${id}-price`}
            value={metadata.selling_price}
            onChange={(v) => onMetadataChange({ selling_price: v })}
            min={0}
            className="pl-7"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-status`}>Status</Label>
        <Select
          id={`${id}-status`}
          value={metadata.status}
          onChange={(e) => onMetadataChange({ status: e.target.value as RecipeStatus })}
          options={STATUS_OPTIONS}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] leading-5 font-medium text-muted-foreground">Visibility</span>
        <div className="flex h-9 items-center max-sm:h-11">
          <Checkbox
            checked={metadata.is_public}
            onChange={(e) => onMetadataChange({ is_public: e.target.checked })}
            label="Public"
          />
        </div>
      </div>
    </div>
  );
}

/** Name, version line, costs and the collapsible details grid. */
export function CanvasHeader({
  metadata,
  onMetadataChange,
  canvasCost,
  rootRecipeName,
  currentVersion,
}: {
  metadata: RecipeMetadata;
  onMetadataChange: (updates: Partial<RecipeMetadata>) => void;
  canvasCost: number;
  rootRecipeName: string | null;
  currentVersion: number | null;
}) {
  const [showDetails, setShowDetails] = useState(true);

  return (
    <header className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Input
            value={metadata.name}
            onChange={(e) => onMetadataChange({ name: e.target.value })}
            placeholder="Dish name"
            aria-label="Dish name"
            className="h-10 border-transparent bg-transparent px-2 text-lg font-medium hover:border-input focus-visible:border-input max-sm:h-11"
          />
          {(rootRecipeName || currentVersion) && (
            <p className="px-2 text-sm text-tertiary">
              {rootRecipeName ? `Based on ${rootRecipeName}` : 'Original'}
              {currentVersion ? ` · v${currentVersion}` : ''}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
          className="mt-1 shrink-0"
        >
          Details
          <ChevronDown
            className={cn('size-4 transition-transform', showDetails && 'rotate-180')}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </Button>
      </div>

      <CostSummary canvasCost={canvasCost} metadata={metadata} />

      {showDetails && <CanvasDetails metadata={metadata} onMetadataChange={onMetadataChange} />}
    </header>
  );
}
