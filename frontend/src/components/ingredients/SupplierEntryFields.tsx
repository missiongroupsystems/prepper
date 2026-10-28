'use client';

/**
 * One supplier link drafted in the Add ingredient panel: who sells it, at which outlet, and the
 * pack it comes in. Lives in the panel's local state until the ingredient is created.
 */
import { Trash2 } from 'lucide-react';
import { Button, Checkbox, Input, Select } from '@/components/ui';
import { FieldRow, FormField, fieldA11y } from '@/components/forms/FormField';
import type { Outlet, Supplier } from '@/types';

export const UNIT_OPTIONS = [
  { value: 'g', label: 'g (grams)' },
  { value: 'kg', label: 'kg (kilograms)' },
  { value: 'ml', label: 'ml (millilitres)' },
  { value: 'l', label: 'l (litres)' },
  { value: 'pcs', label: 'pcs (pieces)' },
];

export interface SupplierEntry {
  /** Temporary id for list management. */
  id: string;
  supplier_id: string;
  sku: string;
  pack_size: string;
  pack_unit: string;
  price_per_pack: string;
  is_preferred: boolean;
  outlet_id: string;
}

export type SupplierEntryField = Exclude<keyof SupplierEntry, 'id'>;

const REQUIRED_FIELDS: SupplierEntryField[] = ['supplier_id', 'outlet_id', 'pack_size', 'pack_unit', 'price_per_pack'];

/** The required fields this entry is missing. */
export function missingSupplierFields(entry: SupplierEntry): SupplierEntryField[] {
  return REQUIRED_FIELDS.filter((field) => !entry[field]);
}

/** Normalise a typed decimal on blur ("1.50" → "1.5"), leaving anything unparseable alone. */
function normaliseDecimal(value: string): string {
  const n = parseFloat(value);
  return Number.isNaN(n) ? value : String(n);
}

export function SupplierEntryFields({
  entry,
  index,
  suppliers,
  outlets,
  outletLocked,
  usedSupplierIds,
  showErrors,
  onChange,
  onRemove,
}: {
  entry: SupplierEntry;
  index: number;
  suppliers: Supplier[];
  outlets: Outlet[];
  /** A user tied to one outlet cannot pick another. */
  outletLocked: boolean;
  usedSupplierIds: string[];
  /** Show "required" errors — set once the cook has tried to create. */
  showErrors: boolean;
  onChange: (id: string, field: SupplierEntryField, value: string | boolean) => void;
  onRemove: (id: string) => void;
}) {
  const id = (field: string) => `supplier-${entry.id}-${field}`;
  const missing = showErrors ? new Set(missingSupplierFields(entry)) : new Set<SupplierEntryField>();
  const errorFor = (field: SupplierEntryField) => (missing.has(field) ? 'Required' : undefined);
  const set = (field: SupplierEntryField) => (e: { target: { value: string } }) => onChange(entry.id, field, e.target.value);
  const normalise = (field: 'pack_size' | 'price_per_pack') => () =>
    onChange(entry.id, field, normaliseDecimal(entry[field]));

  const supplierOptions = suppliers
    .filter((s) => !usedSupplierIds.includes(s.id.toString()) || s.id.toString() === entry.supplier_id)
    .map((s) => ({ value: s.id.toString(), label: s.name }));

  return (
    <fieldset className="flex flex-col gap-4 rounded-lg bg-surface-sunken p-4 hairline">
      <div className="flex items-center justify-between gap-2">
        <legend className="text-sm font-medium text-ink">Supplier {index + 1}</legend>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(entry.id)}
          aria-label={`Remove supplier ${index + 1}`}
        >
          <Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>

      <FieldRow>
        <FormField id={id('supplier')} label="Supplier" error={errorFor('supplier_id')}>
          <Select
            {...fieldA11y(id('supplier'), errorFor('supplier_id'))}
            value={entry.supplier_id}
            onChange={set('supplier_id')}
            options={[{ value: '', label: 'Select supplier' }, ...supplierOptions]}
          />
        </FormField>
        <FormField id={id('outlet')} label="Outlet" error={errorFor('outlet_id')}>
          <Select
            {...fieldA11y(id('outlet'), errorFor('outlet_id'))}
            value={entry.outlet_id}
            onChange={set('outlet_id')}
            disabled={outletLocked}
            options={[
              { value: '', label: 'Select outlet' },
              ...outlets.map((o) => ({ value: o.id.toString(), label: o.name })),
            ]}
          />
        </FormField>
      </FieldRow>

      <FieldRow>
        <FormField id={id('sku')} label="SKU" optional>
          <Input {...fieldA11y(id('sku'))} placeholder="e.g. SKU-001" value={entry.sku} onChange={set('sku')} />
        </FormField>
        <FormField id={id('price')} label="Price per pack" error={errorFor('price_per_pack')}>
          <Input
            {...fieldA11y(id('price'), errorFor('price_per_pack'))}
            inputMode="decimal"
            placeholder="0.00"
            className="tabular-nums"
            value={entry.price_per_pack}
            onChange={set('price_per_pack')}
            onBlur={normalise('price_per_pack')}
          />
        </FormField>
      </FieldRow>

      <FieldRow>
        <FormField id={id('pack-size')} label="Pack size" error={errorFor('pack_size')}>
          <Input
            {...fieldA11y(id('pack-size'), errorFor('pack_size'))}
            inputMode="decimal"
            placeholder="0"
            className="tabular-nums"
            value={entry.pack_size}
            onChange={set('pack_size')}
            onBlur={normalise('pack_size')}
          />
        </FormField>
        <FormField id={id('pack-unit')} label="Pack unit" error={errorFor('pack_unit')}>
          <Select
            {...fieldA11y(id('pack-unit'), errorFor('pack_unit'))}
            value={entry.pack_unit}
            onChange={set('pack_unit')}
            options={[{ value: '', label: 'Select unit' }, ...UNIT_OPTIONS]}
          />
        </FormField>
      </FieldRow>

      <Checkbox
        checked={entry.is_preferred}
        onChange={(e) => onChange(entry.id, 'is_preferred', e.target.checked)}
        label="Preferred supplier"
      />
    </fieldset>
  );
}
