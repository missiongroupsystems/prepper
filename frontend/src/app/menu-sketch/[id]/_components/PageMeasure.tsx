import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Workforce's content measure and gutters (styleguide §7.1): 1080px, centred, 20/32/48px sides. */
export const PAGE_GUTTERS = 'mx-auto w-full max-w-content px-5 sm:px-8 lg:px-12';

/**
 * Local stand-in for Workforce's `Page` until Phase 2B's shared one lands; Phase 3 swaps it.
 * Same measure, padding and 24px rhythm.
 */
export function PageMeasure({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn(PAGE_GUTTERS, 'flex flex-col gap-6 py-6 sm:py-8 lg:pt-10 lg:pb-16', className)}>
      {children}
    </div>
  );
}
