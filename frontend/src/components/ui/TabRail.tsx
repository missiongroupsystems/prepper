'use client';

/**
 * TabRail (§12.5) — the underline tab rail for SECTIONS of a page (settings sections, a recipe's
 * canvas tabs), where the tabs are peers you move between. A view switch over the same data is a
 * SegmentedControl instead.
 *
 * Two behaviours, one look:
 * - Items with `href` render links with `aria-current` — each tab is a page; not ARIA tabs,
 *   because announcing a tablist would promise in-place panel swapping.
 * - Otherwise it swaps in place: `role="tablist"`, one tab stop, Left/Right/Home/End move the
 *   selection and call `onSelect`. Give each item a `panelId` to wire `aria-controls`.
 */
import type { KeyboardEvent } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface TabRailItem {
  id: string;
  label: string;
  href?: string;
  /** The id of the panel this tab shows (in-place mode). */
  panelId?: string;
}

function tabClasses(isActive: boolean) {
  return cn(
    '-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors duration-(--dur-quick)',
    'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
    isActive ? 'border-accent font-medium text-ink' : 'border-transparent text-muted-foreground hover:text-ink'
  );
}

const STEPS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };

export function TabRail({
  items,
  activeId,
  label,
  onSelect,
  className,
}: {
  items: TabRailItem[];
  activeId: string;
  /** Names the rail for a screen reader — "Recipe sections". */
  label: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const railClasses = cn('flex gap-1 overflow-x-auto border-b border-hairline', className);

  if (items.every((item) => item.href)) {
    return (
      <nav aria-label={label} className={railClasses}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <Link
              key={item.id}
              href={item.href as string}
              aria-current={isActive ? 'page' : undefined}
              className={tabClasses(isActive)}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.id === activeId);
    let nextIndex: number;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;
    else if (event.key in STEPS) nextIndex = (index + STEPS[event.key] + items.length) % items.length;
    else return;
    event.preventDefault();
    onSelect?.(items[nextIndex].id);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[nextIndex]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={railClasses}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={item.panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect?.(item.id)}
            className={tabClasses(isActive)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
