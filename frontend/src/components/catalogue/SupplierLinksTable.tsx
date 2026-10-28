'use client';

/**
 * SupplierLinksTable — the supplier ↔ ingredient pricing links, shared by the ingredient page
 * (rows name the supplier) and the supplier page (rows name the ingredient).
 *
 * Every field autosaves in place: SKU, pack size and price through `EditableCell`, the pack unit
 * through `Select`. The kebab is always visible; removing a link confirms first. Rows stack on
 * phones (see `StackedTable`).
 */
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink, Star, StarOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Badge,
  ConfirmModal,
  EditableCell,
  EntityCode,
  MenuItem,
  MenuSeparator,
  Select,
  Table,
  TableBody,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { displayNameParts, formatDisplayName } from '@/lib/format/displayName';
import type { SupplierIngredient, UpdateSupplierIngredientRequest } from '@/types';
import { RowActionsMenu } from './RowActionsMenu';
import {
  ActionsHead,
  StackedActionsCell,
  StackedCell,
  StackedTitleCell,
  stackedBodyClasses,
  stackedHeaderClasses,
  stackedRowClasses,
  stackedTableClasses,
} from './StackedTable';
import { UNIT_OPTIONS, parsePositive, unitCost } from './supplierLinks';

const COLUMN_COUNT = 8;
const UNIT_SHORT_OPTIONS = UNIT_OPTIONS.map((o) => ({ value: o.value, label: o.value }));

export interface SupplierLinksTableProps {
  links: SupplierIngredient[];
  /** The other side of each link, named in the first column. */
  counterpart: 'supplier' | 'ingredient';
  onUpdate: (link: SupplierIngredient, data: UpdateSupplierIngredientRequest) => void;
  /** Resolves once the link is gone (or the failure is reported); the confirm stays busy until then. */
  onRemove: (link: SupplierIngredient) => Promise<void>;
  /** What the single empty row says. */
  empty: ReactNode;
}

export function SupplierLinksTable({ links, counterpart, onUpdate, onRemove, empty }: SupplierLinksTableProps) {
  const [confirming, setConfirming] = useState<SupplierIngredient | null>(null);
  const [removing, setRemoving] = useState(false);
  const counterpartLabel = counterpart === 'supplier' ? 'Supplier' : 'Ingredient';

  const partsOf = (link: SupplierIngredient) =>
    displayNameParts((counterpart === 'supplier' ? link.supplier_name : link.ingredient_name) ?? 'Unknown');
  const nameOf = (link: SupplierIngredient) => partsOf(link).name;
  const hrefOf = (link: SupplierIngredient) =>
    counterpart === 'supplier' ? `/suppliers/${link.supplier_id}` : `/ingredients/${link.ingredient_id}`;

  const savePositive = (link: SupplierIngredient, field: 'pack_size' | 'price_per_pack', label: string) => (value: string) => {
    const n = parsePositive(value);
    if (n === null) {
      toast.error(`${label} must be a number above 0`);
      return;
    }
    onUpdate(link, { [field]: n });
  };

  const confirmRemove = async () => {
    if (!confirming) return;
    setRemoving(true);
    await onRemove(confirming);
    setRemoving(false);
    setConfirming(null);
  };

  return (
    <>
      <Table framed className={stackedTableClasses}>
        <TableHeader className={stackedHeaderClasses}>
          <TableRow>
            <TableHead>{counterpartLabel}</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead numeric>Pack size</TableHead>
            <TableHead>Pack unit</TableHead>
            <TableHead numeric>Price per pack</TableHead>
            <TableHead numeric>Unit cost</TableHead>
            <ActionsHead />
          </TableRow>
        </TableHeader>
        <TableBody className={stackedBodyClasses}>
          {links.length === 0 && <TableEmpty colSpan={COLUMN_COUNT}>{empty}</TableEmpty>}
          {links.map((link) => (
            <TableRow key={link.id} className={stackedRowClasses}>
              <StackedTitleCell>
                {partsOf(link).code && <EntityCode className="mb-0.5">{partsOf(link).code}</EntityCode>}
                <span className="flex flex-wrap items-center gap-2">
                  <Link href={hrefOf(link)} className="hover:underline">
                    {nameOf(link)}
                  </Link>
                  {link.is_preferred && <Badge variant="info">Preferred</Badge>}
                </span>
              </StackedTitleCell>
              <StackedCell label="Outlet" className="text-muted-foreground">
                {link.outlet_name ? formatDisplayName(link.outlet_name) : '—'}
              </StackedCell>
              <StackedCell label="SKU">
                <EditableCell
                  value={link.sku ?? ''}
                  placeholder="Add SKU"
                  onSave={(value) => onUpdate(link, { sku: value.trim() || null })}
                  className="font-mono text-xs whitespace-nowrap"
                />
              </StackedCell>
              <StackedCell label="Pack size" numeric>
                <EditableCell
                  type="number"
                  value={String(link.pack_size)}
                  onSave={savePositive(link, 'pack_size', 'Pack size')}
                  className="w-24 text-right"
                />
              </StackedCell>
              <StackedCell label="Pack unit">
                <Select
                  aria-label="Pack unit"
                  value={link.pack_unit}
                  options={UNIT_SHORT_OPTIONS}
                  onChange={(e) => onUpdate(link, { pack_unit: e.target.value })}
                  className="h-8 w-20"
                />
              </StackedCell>
              <StackedCell label="Price per pack" numeric>
                <EditableCell
                  type="number"
                  value={String(link.price_per_pack)}
                  displayValue={formatCurrency(link.price_per_pack)}
                  onSave={savePositive(link, 'price_per_pack', 'Price per pack')}
                  className="w-24 text-right"
                />
              </StackedCell>
              <StackedCell label="Unit cost" numeric>
                <span>
                  {formatCurrency(unitCost(link))}
                  <span className="text-tertiary"> / {link.pack_unit}</span>
                </span>
              </StackedCell>
              <StackedActionsCell>
                <RowActionsMenu label={`Actions for ${nameOf(link)}`}>
                  <MenuItem href={hrefOf(link)} icon={ExternalLink}>
                    Open {counterpartLabel.toLowerCase()}
                  </MenuItem>
                  <MenuItem
                    icon={link.is_preferred ? StarOff : Star}
                    onSelect={() => onUpdate(link, { is_preferred: !link.is_preferred })}
                  >
                    {link.is_preferred ? 'Unmark as preferred' : 'Mark as preferred'}
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem danger icon={Trash2} onSelect={() => setConfirming(link)}>
                    Remove link
                  </MenuItem>
                </RowActionsMenu>
              </StackedActionsCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmModal
        isOpen={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={confirmRemove}
        title="Remove supplier link"
        message={
          confirming
            ? `${nameOf(confirming)} and its pack pricing will be removed from this ${counterpart === 'supplier' ? 'ingredient' : 'supplier'}.`
            : ''
        }
        confirmLabel="Remove link"
        variant="destructive"
        pending={removing}
      />
    </>
  );
}
