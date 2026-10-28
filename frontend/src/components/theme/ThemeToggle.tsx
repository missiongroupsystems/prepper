'use client';

/**
 * Theme toggle — System · Light · Dark as a radio group (it picks a value in place and
 * navigates nowhere). Arrow keys move and select; only the chosen option is a tab stop.
 * Phase 2 places it in the top bar / user menu; until then it lives on /design-system.
 */
import { useRef, type KeyboardEvent } from 'react';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEME_CHOICES, type ThemeChoice } from '@/lib/theme';
import { useTheme } from './ThemeProvider';

const OPTIONS: Record<ThemeChoice, { label: string; icon: LucideIcon }> = {
  system: { label: 'System', icon: Monitor },
  light: { label: 'Light', icon: Sun },
  dark: { label: 'Dark', icon: Moon },
};

const ARROW_STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export function ThemeToggle({ className }: { className?: string }) {
  const { choice, setChoice } = useTheme();
  const groupRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = ARROW_STEP[event.key];
    if (!step) return;
    event.preventDefault();
    const index = THEME_CHOICES.indexOf(choice);
    const next = THEME_CHOICES[(index + step + THEME_CHOICES.length) % THEME_CHOICES.length];
    setChoice(next);
    groupRef.current?.querySelector<HTMLElement>(`[data-choice="${next}"]`)?.focus();
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Theme"
      onKeyDown={onKeyDown}
      className={cn('inline-flex rounded-pill bg-surface-sunken p-0.5', className)}
    >
      {THEME_CHOICES.map((id) => {
        const { label, icon: Icon } = OPTIONS[id];
        const isChosen = id === choice;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isChosen}
            data-choice={id}
            tabIndex={isChosen ? 0 : -1}
            onClick={() => setChoice(id)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-xs font-medium transition-colors duration-(--dur-quick)',
              isChosen ? 'bg-card text-foreground shadow-card' : 'text-tertiary hover:text-foreground'
            )}
          >
            <Icon className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
