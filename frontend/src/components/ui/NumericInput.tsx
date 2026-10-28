'use client';

/**
 * NumericInput — the Input field for a number that commits on blur: free typing while focused,
 * then parse, clamp to `min`/`max`, and fall back to `fallback` (or the last value) if unparsable.
 * Right-aligned tabular figures so a column of quantities lines up.
 */
import { useState, useEffect, useRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { controlClasses } from './Input';

interface NumericInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  fallback?: number;
}

export function NumericInput({ value, onChange, min, max, fallback, className, ...rest }: NumericInputProps) {
  const [local, setLocal] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setLocal(String(value));
  }, [value]);

  const handleBlur = () => {
    focused.current = false;
    const parsed = parseFloat(local);
    if (isNaN(parsed)) {
      setLocal(String(fallback ?? value));
      return;
    }
    let clamped = min !== undefined ? Math.max(min, parsed) : parsed;
    clamped = max !== undefined ? Math.min(max, clamped) : clamped;
    onChange(clamped);
    setLocal(String(clamped));
  };

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={(e) => {
        focused.current = true;
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        handleBlur();
        rest.onBlur?.(e);
      }}
      className={cn(controlClasses, 'py-1.5 text-right tabular-nums', className)}
    />
  );
}
