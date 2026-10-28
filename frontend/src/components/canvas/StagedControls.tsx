'use client';

/**
 * Small controls shared by the staged cards, rows and table: the display name (with any imported
 * item code split off), the quantity stepper, the unit and supplier selects, and the row menu.
 */
import { Minus, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, EntityCode, Menu, MenuItem, NumericInput, Select } from '@/components/ui';
import { displayNameParts, formatDisplayName } from '@/lib/format/displayName';
import { getCompatibleUnits } from '@/lib/unitConversion';
import { cn, formatCurrency } from '@/lib/utils';
import type { SupplierIngredient } from '@/types';
import { supplierUnitCost } from './canvasModel';

/** The smallest quantity a row accepts. */
export const MIN_QUANTITY = 0.001;
/** Wastage is a percentage. */
export const MAX_WASTAGE = 100;

/** An imported name in sentence case, its leading `(100039)` item code shown apart. */
export function DisplayName({ name, className }: { name: string; className?: string }) {
  const parts = displayNameParts(name);
  return (
    <span className={cn('block min-w-0', className)}>
      {parts.code && <EntityCode>{parts.code}</EntityCode>}
      <span className="block truncate">{parts.name}</span>
    </span>
  );
}

const stepperButton =
  'grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors ' +
  'hover:bg-surface-hover hover:text-ink pointer-coarse:size-11';

/**
 * − / quantity / +. Minus stops at 1 (as it always has); typing goes as low as {@link MIN_QUANTITY}.
 * The field commits on blur.
 */
export function QuantityStepper({
  value,
  onChange,
  itemName,
  className,
  inputClassName,
}: {
  value: number;
  onChange: (quantity: number) => void;
  /** Names the field and buttons for a screen reader. */
  itemName: string;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={() => onChange(parseFloat(Math.max(1, value - 1).toFixed(1)))}
        aria-label={`Decrease quantity of ${itemName}`}
        className={stepperButton}
      >
        <Minus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
      <NumericInput
        value={value}
        onChange={onChange}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Quantity of ${itemName}`}
        className={cn('w-20 px-2 text-center', inputClassName)}
        min={MIN_QUANTITY}
      />
      <button
        type="button"
        onClick={() => onChange(parseFloat((value + 1).toFixed(1)))}
        aria-label={`Increase quantity of ${itemName}`}
        className={stepperButton}
      >
        <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Units the row's current unit converts to; switching converts quantity and price. */
export function UnitSelect({
  unit,
  onChange,
  itemName,
  className,
}: {
  unit: string;
  onChange: (unit: string) => void;
  itemName: string;
  className?: string;
}) {
  return (
    <Select
      value={unit}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Unit for ${itemName}`}
      options={getCompatibleUnits(unit).map((u) => ({ value: u, label: u }))}
      className={cn('w-24', className)}
    />
  );
}

/** The supplier select's value for "no supplier picked": price at the median. */
const MEDIAN_SUPPLIER_VALUE = 'median';

/** Which supplier prices the row; none means the median of all of them. */
export function SupplierSelect({
  supplierId,
  suppliers,
  onChange,
  itemName,
  className,
}: {
  supplierId: number | null;
  suppliers: SupplierIngredient[];
  onChange: (supplierId: number | null) => void;
  itemName: string;
  className?: string;
}) {
  return (
    <Select
      value={supplierId != null ? String(supplierId) : MEDIAN_SUPPLIER_VALUE}
      onChange={(e) => onChange(e.target.value === MEDIAN_SUPPLIER_VALUE ? null : parseInt(e.target.value, 10))}
      aria-label={`Supplier for ${itemName}`}
      options={[
        { value: MEDIAN_SUPPLIER_VALUE, label: 'No supplier (median)' },
        ...suppliers.map((s) => ({
          value: String(s.supplier_id),
          label: `${formatDisplayName(s.supplier_name ?? '')} — $${supplierUnitCost(s).toFixed(2)}/${s.pack_unit}`,
        })),
      ]}
      className={className}
    />
  );
}

/** Wastage % field. */
export function WastageInput({
  value,
  onChange,
  itemName,
  className,
}: {
  value: number;
  onChange: (wastage: number) => void;
  itemName: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <NumericInput
        value={value}
        onChange={onChange}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Wastage percentage for ${itemName}`}
        className="w-16 px-2 text-center"
        min={0}
        max={MAX_WASTAGE}
      />
      <span className="text-sm text-tertiary">%</span>
    </div>
  );
}

/**
 * The always-visible row menu. 36px, 44px on a touch screen. `children` adds items above Remove.
 */
export function RowActions({ itemName, onRemove, children }: { itemName: string; onRemove: () => void; children?: ReactNode }) {
  return (
    <Menu
      label={`Actions for ${itemName}`}
      trigger={(props) => (
        <Button {...props} variant="ghost" size="icon" aria-label={`Actions for ${itemName}`} className="pointer-coarse:size-11">
          <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </Button>
      )}
    >
      {children}
      <MenuItem icon={Trash2} danger onSelect={onRemove}>
        Remove from canvas
      </MenuItem>
    </Menu>
  );
}

/** "$4.90 ($0.01/g)" — the line cost and the unit price it came from; `stacked` breaks the line. */
export function LineCost({
  quantity,
  unitPrice,
  unit,
  stacked,
}: {
  quantity: number;
  unitPrice: number | null;
  unit: string;
  stacked?: boolean;
}) {
  if (unitPrice == null) return <span className="text-sm text-tertiary">No pricing</span>;
  return (
    <span className="text-sm tabular-nums text-muted-foreground">
      <span className="font-medium text-ink">{formatCurrency(quantity * unitPrice)}</span>
      {stacked ? <br /> : ' '}(${unitPrice.toFixed(2)}/{unit})
    </span>
  );
}
