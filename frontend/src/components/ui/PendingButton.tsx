'use client';

/**
 * PendingButton — Button with a pessimistic-mutation pending state: disabled, `aria-busy`, a
 * spinner over the label. The label goes `invisible` rather than unmounting so the button keeps
 * its width and the Cancel beside it does not shift.
 */
import { Button, type ButtonProps } from './Button';
import { Spinner } from './Spinner';
import { cn } from '@/lib/utils';

export interface PendingButtonProps extends Omit<ButtonProps, 'loading'> {
  pending: boolean;
}

export function PendingButton({ pending, children, disabled, className, ...props }: PendingButtonProps) {
  return (
    <Button
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={cn('relative', className)}
      {...props}
    >
      {pending && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner className="border-current/25 border-t-current" />
        </span>
      )}
      <span className={cn('inline-flex items-center gap-2', pending && 'invisible')}>{children}</span>
    </Button>
  );
}
