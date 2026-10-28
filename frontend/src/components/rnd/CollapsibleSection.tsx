'use client';

/**
 * A card whose body opens and closes under a full-width header button. The summary on the right
 * stays visible while it is closed.
 */
import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  icon?: LucideIcon;
  title: string;
  summary?: ReactNode;
  children: ReactNode;
}

export function CollapsibleSection({ icon: Icon, title, summary, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const bodyId = useId();
  return (
    <section className="rounded-lg bg-card hairline">
      <h2>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={bodyId}
          className={cn(
            'flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-hover',
            isOpen ? 'rounded-t-lg' : 'rounded-lg'
          )}
        >
          {Icon && <Icon className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />}
          <span className="flex-1 text-base font-medium text-ink">{title}</span>
          {summary && <span className="text-sm text-muted-foreground tabular-nums">{summary}</span>}
          <ChevronDown
            className={cn('size-5 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>
      </h2>
      {isOpen && (
        <div id={bodyId} className="border-t border-line p-5">
          {children}
        </div>
      )}
    </section>
  );
}
