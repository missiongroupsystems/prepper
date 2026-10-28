/**
 * Spinner (§12.8) — the thin accent arc, ONLY for in-control pending (inside a button, beside
 * an acting control). Page and section reads use Skeleton. Static ring under reduced motion.
 */
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Working"
      className={cn(
        'inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-accent/25 border-t-accent',
        'motion-reduce:animate-none',
        className
      )}
    />
  );
}
