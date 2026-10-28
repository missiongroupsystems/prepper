/**
 * Input (§3.4, §11). A sunken beige field with a 1px perceivable control border (a hairline
 * fails WCAG 1.4.11 as a control boundary), 8px radius, 36px tall, weight 400. Hover darkens the
 * border; focus is the accent ring; `aria-invalid` turns the border to the danger tone so a
 * failed field is visible before its message is read (pair it with `aria-describedby` → FieldError).
 *
 * Below `sm` the field is 44px with 16px text: 44px is the touch minimum, and iOS Safari zooms
 * into any focused field under 16px and never zooms back out.
 *
 * `controlClasses` is THE field look — Textarea, Select, SearchInput, NumericInput and
 * EditableCell all build on it, so a field restyle happens in one place.
 */
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const controlClasses =
  'w-full rounded-md bg-surface-sunken px-3 text-sm font-normal text-ink max-sm:text-base ' +
  'border border-input placeholder:text-placeholder ' +
  'transition-[border-color,background-color] duration-(--dur-quick) hover:border-ink ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
  'aria-invalid:border-danger ' +
  'disabled:cursor-not-allowed disabled:text-disabled disabled:hover:border-input';

/** The field height: 36px, 44px below `sm`. */
export const controlHeight = 'h-9 max-sm:h-11';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input ref={ref} type={type} className={cn(controlClasses, controlHeight, className)} {...props} />
  )
);
Input.displayName = 'Input';
