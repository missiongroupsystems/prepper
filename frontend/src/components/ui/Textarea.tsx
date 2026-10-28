/** Textarea (§11) — the same field as Input, taller and vertically resizable. */
import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { controlClasses } from './Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlClasses, 'min-h-9 resize-y py-2 leading-5', className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
