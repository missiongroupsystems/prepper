'use client';

/** SearchInput — the Input field with a leading search glyph and an optional clear button. */
import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlClasses, controlHeight } from './Input';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, ...props }, ref) => {
    const hasValue = value !== undefined && String(value).length > 0;

    return (
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tertiary"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="text"
          value={value}
          className={cn(
            controlClasses,
            controlHeight,
            'pr-9 pl-9',
            className
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={onClear}
            className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-tertiary transition-colors duration-(--dur-quick) hover:bg-surface-hover hover:text-ink"
          >
            <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';
