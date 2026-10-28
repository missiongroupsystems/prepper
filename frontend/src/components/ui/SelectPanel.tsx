'use client';

/**
 * The Select primitive's open list — the anchored panel (or, on a phone, the bottom sheet), its
 * search field and its options. `Select.tsx` owns every piece of state; this renders it.
 */
import { Fragment, type KeyboardEvent, type RefObject } from 'react';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Option, Placement } from './selectModel';

export interface SelectPanelProps {
  asSheet: boolean;
  placement: Placement | null;
  panelRef: RefObject<HTMLDivElement | null>;
  onPanelKey: (e: KeyboardEvent) => void;
  showSearch: boolean;
  searchPlaceholder: string;
  searchRef: RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (query: string) => void;
  choose: (next: Option) => void;
  listId: string;
  ariaLabel: string | undefined;
  labelledBy: string | undefined;
  visible: Option[];
  current: string;
}

export function SelectPanel({
  asSheet,
  placement,
  panelRef,
  onPanelKey,
  showSearch,
  searchPlaceholder,
  searchRef,
  query,
  setQuery,
  choose,
  listId,
  ariaLabel,
  labelledBy,
  visible,
  current,
}: SelectPanelProps) {
  const firstEnabled = visible.find((o) => !o.disabled);

  return (
    <>
      {/* Decorative: a tap outside the sheet already closes it (useAnchoredDismiss). */}
      {asSheet && <div aria-hidden="true" className="animate-scrim-in fixed inset-0 z-60 scrim" />}
      <div
        ref={panelRef}
        onKeyDown={onPanelKey}
        // Computed geometry — the one inline style, because the position depends on the field's
        // place in the viewport when it opens. A sheet is pinned to the bottom edge instead.
        style={asSheet || !placement ? undefined : placement}
        className={cn(
          'fixed z-60 flex flex-col overflow-hidden bg-popover shadow-pop',
          asSheet
            ? 'animate-sheet-up inset-x-0 bottom-0 max-h-[75dvh] rounded-t-xl pb-[env(safe-area-inset-bottom)]'
            : 'animate-pop-in rounded-xl hairline'
        )}
      >
        {asSheet && <span aria-hidden="true" className="mx-auto mt-2 mb-1 h-1 w-9 shrink-0 rounded-full bg-track" />}
        {showSearch && (
          <div className="shrink-0 border-b border-line p-2">
            <label className="relative block">
              <span className="sr-only">{searchPlaceholder}</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-tertiary"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                placeholder={searchPlaceholder}
                aria-controls={listId}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && firstEnabled) {
                    e.preventDefault();
                    choose(firstEnabled);
                  }
                }}
                className={cn(
                  'h-9 w-full rounded-md border border-input bg-surface-sunken pr-8 pl-8 text-sm text-ink max-sm:h-11 max-sm:text-base',
                  'transition-[border-color] duration-(--dur-quick) placeholder:text-placeholder hover:border-ink',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
                )}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery('');
                    searchRef.current?.focus();
                  }}
                  className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-tertiary hover:bg-surface-hover hover:text-ink"
                >
                  <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                </button>
              )}
            </label>
          </div>
        )}
        <div
          id={listId}
          role="listbox"
          aria-labelledby={ariaLabel ? undefined : labelledBy}
          aria-label={ariaLabel}
          className="flex min-h-0 flex-col gap-px overflow-y-auto p-1.5"
        >
          {visible.map((o, i) => {
            // One heading per group change, in source order.
            const lastGroup = i === 0 ? undefined : visible[i - 1].group;
            const heading = o.group !== lastGroup && o.group ? o.group : null;
            const isSelected = o.value === current;
            return (
              <Fragment key={`${o.group ?? ''}:${o.value}`}>
                {heading && <p className="px-2.5 pt-2 pb-1 text-xs text-tertiary first:pt-1">{heading}</p>}
                <button
                  type="button"
                  role="option"
                  tabIndex={-1}
                  data-select-option=""
                  data-select-label={o.label.toLowerCase()}
                  aria-selected={isSelected}
                  aria-disabled={o.disabled || undefined}
                  onClick={() => choose(o)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-ink outline-none',
                    asSheet && 'min-h-11 text-base',
                    'transition-colors duration-(--dur-quick) hover:bg-surface-hover focus-visible:bg-surface-hover',
                    isSelected && 'bg-surface-selected font-medium hover:bg-surface-selected',
                    o.value === '' && 'text-muted-foreground',
                    o.disabled && 'cursor-not-allowed text-disabled hover:bg-transparent'
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{o.label}</span>
                    {o.description && <span className="text-xs font-normal text-tertiary">{o.description}</span>}
                  </span>
                  {isSelected && <Check className="size-4 shrink-0 text-accent" strokeWidth={1.5} aria-hidden="true" />}
                </button>
              </Fragment>
            );
          })}
          {visible.length === 0 && (
            <p className="px-2.5 py-3 text-sm text-tertiary">Nothing matches “{query.trim()}”.</p>
          )}
        </div>
      </div>
    </>
  );
}
