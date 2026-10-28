'use client';

/**
 * SegmentedControl (§12.5) — a beige pill track for a VIEW SWITCH over the same data (grid or
 * list, a day of the week). The selected segment is accent-filled with inverse text, the
 * accent's named "selected" role. Sections of a page are a TabRail instead.
 *
 * Two behaviours, one look:
 * - Items with `href` render links (`aria-current`) — use when the view lives in the URL.
 * - Otherwise it swaps in place: `role="tablist"`, one tab stop, Left/Right arrows move the
 *   selection and call `onSelect`.
 *
 * Icon-only segments pass `icon` and keep `label` as the accessible name.
 */
import type { ComponentType, KeyboardEvent } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/** The sunken pill track with its 2px inset. */
export const segmentedTrackClasses = 'inline-flex items-center gap-0.5 rounded-full bg-surface-sunken p-0.5 hairline';

/** One segment: accent fill + inverse text when selected, secondary text when not. */
export function segmentedSegmentClasses(isActive: boolean): string {
  return cn(
    'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap',
    'transition-colors duration-(--dur-base) max-sm:min-h-11',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-ink'
  );
}

export interface SegmentedItem {
  id: string;
  label: string;
  href?: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: 'true' }>;
  /** Show only the icon; `label` stays the accessible name. */
  iconOnly?: boolean;
}

export function SegmentedControl({
  items,
  activeId,
  label,
  onSelect,
  className,
}: {
  items: SegmentedItem[];
  activeId: string;
  /** Names the control for a screen reader — it has no visible heading. */
  label: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const content = (item: SegmentedItem) => {
    const Icon = item.icon;
    return (
      <>
        {Icon && <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />}
        {item.iconOnly ? <span className="sr-only">{item.label}</span> : item.label}
      </>
    );
  };

  if (items.every((item) => item.href)) {
    return (
      <nav aria-label={label} className={cn(segmentedTrackClasses, className)}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <Link
              key={item.id}
              href={item.href as string}
              aria-current={isActive ? 'page' : undefined}
              className={cn(segmentedSegmentClasses(isActive), item.iconOnly && 'px-2')}
            >
              {content(item)}
            </Link>
          );
        })}
      </nav>
    );
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const index = items.findIndex((item) => item.id === activeId);
    const next = items[(index + step + items.length) % items.length];
    onSelect?.(next.id);
    const tabs = event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]');
    tabs[items.indexOf(next)]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cn(segmentedTrackClasses, className)}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            title={item.iconOnly ? item.label : undefined}
            onClick={() => onSelect?.(item.id)}
            className={cn(segmentedSegmentClasses(isActive), item.iconOnly && 'px-2')}
          >
            {content(item)}
          </button>
        );
      })}
    </div>
  );
}
