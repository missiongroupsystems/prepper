'use client';

/**
 * Switch (§11). 36×20 pill, `role="switch"`, 120ms slide. On = accent; off = the warm track.
 *
 * Built on a native checkbox so both APIs work: `onCheckedChange(checked)` (Workforce's) and the
 * plain `onChange(event)` existing Recipes call sites use. Each switch is independent — never
 * gang several settings into one control. `label` renders a bound `<label>` beside it.
 */
import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, onChange, onCheckedChange, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const control = (
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        role="switch"
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.currentTarget.checked);
        }}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer appearance-none items-center rounded-full bg-track',
          'transition-colors duration-(--dur-quick) ease-(--ease-out-soft) checked:bg-accent',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Knob
          'before:pointer-events-none before:absolute before:top-0.5 before:left-0.5 before:size-4 before:rounded-full before:bg-card before:shadow-card before:content-[""]',
          'before:transition-transform before:duration-(--dur-quick) before:ease-(--ease-out-soft) checked:before:translate-x-4',
          className
        )}
        {...props}
      />
    );
    if (!label) return control;
    return (
      <span className="inline-flex items-center gap-2">
        {control}
        <label htmlFor={inputId} className="cursor-pointer text-sm text-ink select-none">
          {label}
        </label>
      </span>
    );
  }
);
Switch.displayName = 'Switch';
