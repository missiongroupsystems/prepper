/**
 * EntityCode — the item or supplier code split off an imported name (`(100039) IQF …`), shown as
 * a small muted mono line above or beside the name, never inside the title.
 */
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function EntityCode({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('block font-mono text-xs tabular-nums text-tertiary', className)} {...props} />;
}
