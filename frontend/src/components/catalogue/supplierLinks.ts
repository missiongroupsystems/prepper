/**
 * Shared helpers for supplier ↔ ingredient links (`SupplierIngredient`), used by the ingredient
 * and supplier detail pages.
 */
import type { SelectOption } from '@/components/ui';

export const UNIT_OPTIONS: SelectOption[] = [
  { value: 'g', label: 'g (grams)' },
  { value: 'kg', label: 'kg (kilograms)' },
  { value: 'ml', label: 'ml (milliliters)' },
  { value: 'l', label: 'l (liters)' },
  { value: 'pcs', label: 'pcs (pieces)' },
];

/** Status code the API returns for a duplicate link (same supplier, ingredient and outlet, or SKU). */
export const DUPLICATE_LINK_STATUS = 422;

export function unitCost(link: { pack_size: number; price_per_pack: number }): number {
  return link.pack_size > 0 ? link.price_per_pack / link.pack_size : 0;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** The median unit cost across links priced in `unit`; `null` when none are. */
export function medianUnitCost(links: { pack_unit: string; pack_size: number; price_per_pack: number }[], unit: string) {
  return median(links.filter((l) => l.pack_unit === unit).map(unitCost));
}

/** Parses a typed amount; `null` for blank, non-numeric or non-positive input. */
export function parsePositive(value: string): number | null {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function isDuplicateLinkError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === DUPLICATE_LINK_STATUS;
}
