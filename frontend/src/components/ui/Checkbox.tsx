'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, disabled, label, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className={cn(
            'relative h-5 w-5 appearance-none rounded border-2 transition-all',
            'border-input',
            'bg-card',
            'checked:bg-primary checked:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-secondary',
            'hover:enabled:border-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'cursor-pointer',
            // Checkmark using ::after pseudo-element
            'after:content-[""] after:absolute after:hidden',
            'checked:after:block',
            'after:left-1.5 after:top-0.5 after:h-3 after:w-1.5',
            'after:border-r-2 after:border-b-2 after:border-primary-foreground',
            'after:transform after:rotate-45',
            className
          )}
          {...props}
        />
        {label && (
          <label className="text-sm text-muted-foreground cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
