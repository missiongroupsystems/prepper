import { test, expect } from '@playwright/test';
import { formatTimeOfDay, parseDateTimeComponents, toOffsetDateTimeString, toUtcDate } from './sessionDate';

test.describe('toUtcDate', () => {
  test('treats a bare datetime as UTC', () => {
    expect(toUtcDate('2026-11-03T10:00:00').toISOString()).toBe('2026-11-03T10:00:00.000Z');
  });

  test('keeps an explicit offset', () => {
    expect(toUtcDate('2026-11-03T10:00:00+08:00').toISOString()).toBe('2026-11-03T02:00:00.000Z');
  });
});

test.describe('time of day round trip', () => {
  test('parses into a 12-hour time and back to the same local datetime', () => {
    const local = new Date(2026, 10, 3, 14, 30);
    const parsed = parseDateTimeComponents(local.toISOString());
    expect(formatTimeOfDay(parsed)).toBe('2:30 PM');
    const roundTripped = toOffsetDateTimeString(parsed.date, parsed);
    expect(new Date(roundTripped).getTime()).toBe(local.getTime());
  });

  test('midnight and noon map to 12 AM and 12 PM', () => {
    expect(formatTimeOfDay(parseDateTimeComponents(new Date(2026, 0, 1, 0, 0).toISOString()))).toBe('12:00 AM');
    expect(formatTimeOfDay(parseDateTimeComponents(new Date(2026, 0, 1, 12, 0).toISOString()))).toBe('12:00 PM');
  });

  test('rounds minutes to the quarter hour', () => {
    expect(parseDateTimeComponents(new Date(2026, 0, 1, 9, 52).toISOString()).minute).toBe('45');
    expect(parseDateTimeComponents(new Date(2026, 0, 1, 9, 53).toISOString()).minute).toBe('00');
  });
});
