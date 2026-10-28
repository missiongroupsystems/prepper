'use client';

/**
 * Checkbox (§11). Native `<input type="checkbox">` — 18px, accent fill via `accent-color`, the
 * accent focus ring. Native because the browser's checkbox is keyboard- and screen-reader-correct
 * for free and `accent-color` already paints it in the brand.
 *
 * `label` renders a real `<label>` bound to the input, so the text is clickable and named.
 */
import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const input = (
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className={cn(
          'size-[18px] shrink-0 cursor-pointer rounded-sm border border-input bg-card accent-accent',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'aria-invalid:outline-2 aria-invalid:outline-danger',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
    if (!label) return input;
    return (
      <span className="inline-flex items-center gap-2">
        {input}
        <label htmlFor={inputId} className="cursor-pointer text-sm text-ink select-none">
          {label}
        </label>
      </span>
    );
  }
);
Checkbox.displayName = 'Checkbox';
