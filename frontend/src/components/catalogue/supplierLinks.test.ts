import { test, expect } from '@playwright/test';
import { isDuplicateLinkError, median, medianUnitCost, parsePositive, unitCost } from './supplierLinks';

const link = (pack_unit: string, pack_size: number, price_per_pack: number) => ({ pack_unit, pack_size, price_per_pack });

test.describe('unitCost', () => {
  test('divides the pack price by the pack size', () => {
    expect(unitCost(link('kg', 4, 10))).toBe(2.5);
  });

  test('is 0 for an empty pack rather than Infinity', () => {
    expect(unitCost(link('kg', 0, 10))).toBe(0);
  });
});

test.describe('median', () => {
  test('is null for no values', () => {
    expect(median([])).toBeNull();
  });

  test('takes the middle of an odd count, unsorted input', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  test('averages the two middles of an even count', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

test.describe('medianUnitCost', () => {
  test('only counts links priced in the requested unit', () => {
    const links = [link('kg', 1, 2), link('kg', 2, 8), link('g', 1000, 1), link('kg', 1, 6)];
    expect(medianUnitCost(links, 'kg')).toBe(4);
  });

  test('is null when no link uses the unit', () => {
    expect(medianUnitCost([link('g', 500, 3)], 'kg')).toBeNull();
  });
});

test.describe('parsePositive', () => {
  test('parses a positive amount', () => {
    expect(parsePositive('12.5')).toBe(12.5);
  });

  test('rejects blank, zero, negative and non-numeric input', () => {
    for (const value of ['', '0', '-3', 'abc']) expect(parsePositive(value)).toBeNull();
  });
});

test.describe('isDuplicateLinkError', () => {
  test('matches the API duplicate status only', () => {
    expect(isDuplicateLinkError({ status: 422 })).toBe(true);
    expect(isDuplicateLinkError({ status: 500 })).toBe(false);
    expect(isDuplicateLinkError(new Error('boom'))).toBe(false);
    expect(isDuplicateLinkError(null)).toBe(false);
  });
});
