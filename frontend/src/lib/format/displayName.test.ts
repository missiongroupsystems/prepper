import { test, expect } from '@playwright/test';
import { displayNameParts, formatDisplayName, isShouting, supplierDisplayName } from './displayName';

test.describe('formatDisplayName', () => {
  const cases: [string, string][] = [
    ['SAUCES & CONDIMENTS', 'Sauces & condiments'],
    ['DAIRY', 'Dairy'],
    ['POULTRY', 'Poultry'],
    ['DRY GOODS (BEVERAGE)', 'Dry goods (beverage)'],
    ['OPERATIONS - FRONT OF HOUSE', 'Operations - front of house'],
    ['PASTRY / BAKERY', 'Pastry / bakery'],
    ['IQF STRAWBERRIES 1KG', 'IQF strawberries 1kg'],
    ['UHT MILK 1L', 'UHT milk 1L'],
    ['BUTTER 500G', 'Butter 500g'],
    ['CREAM 12X1L', 'Cream 12x1L'],
    ['HEN TIGHS 15X10', 'Hen tighs 15X10'],
    ['GRIOTTINES 15% 1L', 'Griottines 15% 1L'],
    ['BBQ SAUCE', 'BBQ sauce'],
    ['TEMPER PTE LTD', 'Temper PTE LTD'],
    ['FMH SKU LIST', 'FMH SKU list'],
    ['GDI FB FRESH CHICKEN', 'GDI FB fresh chicken'],
    ['"BEAUFOR" VERJUS DU PERIGORD', '"Beaufor" verjus du perigord'],
    ['"BEAUTEX" 3 PLY TOILET ROLL', '"Beautex" 3 ply toilet roll'],
    ['"LA PERRUCHE" WHITE SUGAR', '"La Perruche" white sugar'],
    ['3 PLY NAPKIN', '3 ply napkin'],
    ['(100039) IQF STRAWBERRIES 1KG', '(100039) IQF strawberries 1kg'],
    ['(TEMPER) TEMPER PTE LTD', '(TEMPER) Temper PTE LTD'],
  ];

  for (const [input, expected] of cases) {
    test(`${input} → ${expected}`, () => {
      expect(formatDisplayName(input)).toBe(expected);
    });
  }

  test('leaves mixed-case names untouched', () => {
    for (const name of ['Sauces Condiments', 'Oils Fats', 'Chicken thigh 1KG', 'iPhone case', 'Heinz BBQ Sauce']) {
      expect(formatDisplayName(name)).toBe(name);
    }
  });

  test('leaves names without letters untouched', () => {
    expect(formatDisplayName('100039')).toBe('100039');
    expect(formatDisplayName('')).toBe('');
  });
});

test.describe('isShouting', () => {
  test('uses the upper-case letter ratio', () => {
    expect(isShouting('DAIRY')).toBe(true);
    expect(isShouting('Dairy')).toBe(false);
    expect(isShouting('IQF Strawberries')).toBe(false);
  });
});

test.describe('displayNameParts', () => {
  test('splits a numeric leading code', () => {
    expect(displayNameParts('(100039) IQF STRAWBERRIES 1KG')).toEqual({
      code: '100039',
      name: 'IQF strawberries 1kg',
    });
  });

  test('splits an alphanumeric leading code and keeps it verbatim', () => {
    expect(displayNameParts('(0001FBFR-15X10) FB FRESH HEN THIGHS')).toEqual({
      code: '0001FBFR-15X10',
      name: 'FB fresh hen thighs',
    });
    expect(displayNameParts('(0001GDIORGFT-32X6) GDI ORGANIC FEET')).toEqual({
      code: '0001GDIORGFT-32X6',
      name: 'GDI organic feet',
    });
  });

  test('splits a supplier code', () => {
    expect(displayNameParts('(TEMPER) TEMPER PTE LTD')).toEqual({ code: 'TEMPER', name: 'Temper PTE LTD' });
  });

  test('returns the formatted name alone when there is no code', () => {
    expect(displayNameParts('"BEAUFOR" VERJUS DU PERIGORD')).toEqual({ name: '"Beaufor" verjus du perigord' });
    expect(displayNameParts('Olive oil (extra virgin)')).toEqual({ name: 'Olive oil (extra virgin)' });
  });

  test('does not treat a mixed-case parenthetical as a code', () => {
    expect(displayNameParts('(Vegan) Burger patty')).toEqual({ name: '(Vegan) Burger patty' });
  });
});

test.describe('supplierDisplayName', () => {
  test('drops a leading code that repeats the supplier code', () => {
    expect(supplierDisplayName({ name: '(TEMPER) TEMPER PTE LTD', code: 'TEMPER' })).toEqual({
      code: 'TEMPER',
      name: 'Temper PTE LTD',
    });
  });

  test('uses the code parsed from the name when the supplier has none', () => {
    expect(supplierDisplayName({ name: '(TEMPER) TEMPER PTE LTD', code: null })).toEqual({
      code: 'TEMPER',
      name: 'Temper PTE LTD',
    });
  });

  test('keeps a different leading code in the name', () => {
    expect(supplierDisplayName({ name: '(OLD1) ACME PTE LTD', code: 'ACME' })).toEqual({
      code: 'ACME',
      name: '(OLD1) Acme PTE LTD',
    });
  });

  test('shows the supplier code alongside a plain name', () => {
    expect(supplierDisplayName({ name: 'Fresh Direct', code: 'FD01' })).toEqual({ code: 'FD01', name: 'Fresh Direct' });
  });
});
