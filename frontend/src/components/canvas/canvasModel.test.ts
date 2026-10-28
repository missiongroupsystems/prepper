import { test, expect } from '@playwright/test';
import type { Ingredient, Recipe, SupplierIngredient } from '@/types';
import {
  calculateCanvasCost,
  getIngredientUnitCost,
  hasCanvasChanges,
  newStagedIngredient,
  newStagedRecipe,
  priceForSupplier,
  snapshotCanvas,
  withMedianPrice,
} from './canvasModel';
import { DEFAULT_METADATA, type StagedIngredient } from './types';

const ingredient = (overrides: Partial<Ingredient> = {}): Ingredient => ({
  id: 1,
  name: 'Flour',
  base_unit: 'g',
  cost_per_base_unit: 0.002,
  is_active: true,
  is_halal: false,
  category_id: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

const supplier = (supplier_id: number, price_per_pack: number, pack_size = 1000, pack_unit = 'g') =>
  ({ supplier_id, supplier_name: `Supplier ${supplier_id}`, price_per_pack, pack_size, pack_unit }) as SupplierIngredient;

const recipe = (id: number, cost_price: number | null) => ({ id, name: `Recipe ${id}`, cost_price }) as Recipe;

const staged = (overrides: Partial<StagedIngredient> = {}): StagedIngredient => ({
  ...newStagedIngredient(ingredient()),
  ...overrides,
});

test.describe('calculateCanvasCost', () => {
  test('applies wastage to the ingredient line', () => {
    // 100 g at $0.02/g with 20% wastage: 2.00 / 0.8 = 2.50
    const cost = calculateCanvasCost([staged({ quantity: 100, unitPrice: 0.02, wastage_percentage: 20 })], []);
    expect(cost).toBeCloseTo(2.5);
  });

  test('skips unpriced lines and adds sub-recipes at their cost per portion', () => {
    const recipes = [recipe(7, 1.5)];
    const cost = calculateCanvasCost(
      [staged({ quantity: 10, unitPrice: null })],
      [newStagedRecipe(recipe(7, null), 2)],
      recipes
    );
    expect(cost).toBeCloseTo(3);
  });
});

test.describe('supplier pricing', () => {
  const suppliers = [supplier(1, 10), supplier(2, 20), supplier(3, 40)];

  test('no supplier picked uses the median', () => {
    expect(getIngredientUnitCost(staged(), suppliers)).toMatchObject({ cost: 0.02, label: 'Median' });
  });

  test('an even count uses the mean of the middle two', () => {
    expect(getIngredientUnitCost(staged(), suppliers.slice(0, 2)).cost).toBeCloseTo(0.015);
  });

  test('a picked supplier prices the row, converted to its display unit', () => {
    const row = priceForSupplier(staged({ unit: 'kg' }), 3, suppliers);
    expect(row.selectedSupplierId).toBe(3);
    expect(row.unitPrice).toBeCloseTo(40);
  });

  test('median price fills an unpicked row once suppliers load, and leaves a picked one', () => {
    expect(withMedianPrice(staged({ unitPrice: 0.002 }), suppliers).unitPrice).toBeCloseTo(0.02);
    const picked = staged({ selectedSupplierId: 1, unitPrice: 0.01 });
    expect(withMedianPrice(picked, suppliers)).toBe(picked);
  });
});

test.describe('hasCanvasChanges', () => {
  const items = [staged({ quantity: 100 })];
  const baseline = snapshotCanvas(items, [], DEFAULT_METADATA);

  test('an untouched canvas has no changes', () => {
    expect(hasCanvasChanges(baseline, DEFAULT_METADATA, items, [])).toBe(false);
  });

  test('a quantity, an item or a name change is a change', () => {
    expect(hasCanvasChanges(baseline, DEFAULT_METADATA, [{ ...items[0], quantity: 200 }], [])).toBe(true);
    expect(hasCanvasChanges(baseline, DEFAULT_METADATA, [], [])).toBe(true);
    expect(hasCanvasChanges(baseline, { ...DEFAULT_METADATA, name: 'Tart' }, items, [])).toBe(true);
  });

  test('selling price alone is not tracked', () => {
    expect(hasCanvasChanges(baseline, { ...DEFAULT_METADATA, selling_price: 12 }, items, [])).toBe(false);
  });

  test('with no baseline, anything staged counts', () => {
    expect(hasCanvasChanges(null, DEFAULT_METADATA, [], [])).toBe(false);
    expect(hasCanvasChanges(null, DEFAULT_METADATA, items, [])).toBe(true);
  });
});
