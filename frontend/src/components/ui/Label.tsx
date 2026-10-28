/**
 * Label (§11). 13px, weight 500, secondary ink, above the field, sentence case.
 *
 * FieldHint and FieldError sit under a field and are what its `aria-describedby` points at.
 * An error is the danger tone — never the accent — and is announced when it appears.
 */
import { forwardRef, type HTMLAttributes, type LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-[13px] leading-5 font-medium text-muted-foreground select-none', className)}
      {...props}
    />
  )
);
Label.displayName = 'Label';

export function FieldHint({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs text-tertiary', className)} {...props} />;
}

export function FieldError({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p role="alert" className={cn('text-xs text-danger', className)} {...props} />;
}
