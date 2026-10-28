/**
 * Filter pills — toggle buttons (`aria-pressed`) grouped under a label, wrapping onto as many
 * lines as they need. 13px text, 40px tall on a phone.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** A labelled row of pills: the label sits in its own column from `sm`, above the pills on a phone. */
export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
      <span className="shrink-0 text-[13px] font-medium text-muted-foreground sm:w-28 sm:pt-1.5">{label}</span>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

export function FilterPill({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-[13px] font-medium transition-colors duration-(--dur-quick) max-sm:min-h-10',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        pressed ? 'bg-accent text-accent-foreground' : 'bg-surface-sunken text-ink hairline hover:bg-surface-hover'
      )}
    >
      {children}
    </button>
  );
}
