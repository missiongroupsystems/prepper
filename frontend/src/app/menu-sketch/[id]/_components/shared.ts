import type { MenuSketchSectionItem } from '@/types';

/** Grow a textarea to fit its content. Doubles as a ref callback so it sizes on mount. */
export function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

export function chunk<T>(arr: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n));
  return result;
}

/** Parse a price field on blur; normalises the field text and returns null for empty. */
export function parsePrice(el: HTMLInputElement): number | null {
  const val = el.value === '' ? null : parseFloat(el.value);
  if (val !== null && !isNaN(val)) el.value = String(val);
  return val;
}

/** Food cost as a whole percentage of the sale price, or null when it can't be computed. */
export function costPercent(item: MenuSketchSectionItem): number | null {
  return item.sales_price && item.cost_price && Number(item.sales_price) > 0
    ? Math.round((Number(item.cost_price) / Number(item.sales_price)) * 100)
    : null;
}

export function unresolvedCount(comments: { resolved: boolean }[] | undefined): number {
  return (comments ?? []).filter((c) => !c.resolved).length;
}

export const ICON_DEFS = [
  { key: '⭐', label: 'Signature' },
  { key: '🌶️', label: 'Spicy' },
  { key: '🌿', label: 'Vegetarian' },
  { key: '🐟', label: 'Seafood' },
  { key: '🥩', label: 'Beef' },
  { key: '🐷', label: 'Pork' },
  { key: '🥜', label: 'Nuts' },
];

export interface DisplayOptions {
  description: boolean;
  ingredients: boolean;
  cost: boolean;
  costMargins: boolean;
  comments: boolean;
  feedback: boolean;
}

export const DISPLAY_OPTION_LABELS: Record<keyof DisplayOptions, string> = {
  description: 'Description',
  ingredients: 'Ingredients',
  cost: 'Cost',
  costMargins: 'Cost margins',
  comments: 'Comments',
  feedback: 'Feedback',
};

export type ViewMode = 'list' | 'card';

/**
 * Text that reads as plain type until hovered or focused, then shows the field look — for
 * inline-editable titles (menu name, section name, dish name).
 */
export const inlineFieldClasses =
  'w-full min-w-0 rounded-md border border-transparent bg-transparent px-2 -mx-2 text-ink ' +
  'placeholder:text-placeholder transition-[border-color,background-color] duration-(--dur-quick) ' +
  'hover:border-input focus:border-input focus:bg-surface-sunken ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/** Quiet icon button in a card/section header: 32px, 44px on a phone. */
export const quietIconClasses =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-full text-tertiary max-sm:size-11 ' +
  'transition-colors duration-(--dur-quick) hover:bg-surface-hover hover:text-ink ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/** Suggestion list anchored under a field. */
export const popoverClasses =
  'absolute left-0 top-full z-50 mt-1 w-full overflow-y-auto rounded-lg bg-popover py-1 shadow-pop hairline';

export const popoverOptionClasses =
  'flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[13px] text-ink hover:bg-surface-hover';
