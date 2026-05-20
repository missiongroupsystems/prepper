'use client';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  fallback?: number;
}

export function NumericInput({ value, onChange, min, max, fallback, className, disabled, ...rest }: NumericInputProps) {
  const [local, setLocal] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setLocal(String(value));
  }, [value]);

  const handleBlur = () => {
    focused.current = false;
    const parsed = parseFloat(local);
    if (!isNaN(parsed)) {
      let clamped = min !== undefined ? Math.max(min, parsed) : parsed;
      clamped = max !== undefined ? Math.min(max, clamped) : clamped;
      onChange(clamped);
      setLocal(String(clamped));
    } else {
      setLocal(String(fallback ?? value));
    }
  };

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={(e) => { focused.current = true; rest.onFocus?.(e); }}
      onBlur={(e) => { handleBlur(); rest.onBlur?.(e); }}
      disabled={disabled}
      className={cn(className)}
    />
  );
}
