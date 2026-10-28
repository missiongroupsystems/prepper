/**
 * Skeleton (§12.8) — the loading state for page and section READS. Content-shaped beige blocks,
 * quiet pulse, static under reduced motion. Match the settled content's dimensions so nothing
 * shifts; spinners are only for in-control pending (PendingButton).
 */
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-surface-sunken motion-reduce:animate-none', className)}
    />
  );
}

/** Row-shaped skeleton for a table or list while it loads. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cn('flex flex-col gap-3 p-4', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-5 w-full" />
      ))}
    </div>
  );
}
