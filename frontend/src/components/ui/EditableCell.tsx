'use client';

/**
 * EditableCell — inline edit in place. At rest it is text with a hover fill (focusable, so it
 * is reachable by keyboard: Enter or Space edits); on click it becomes the Input field. Enter or blur commits, Escape
 * restores. Autosave: the caller's `onSave` runs only when the value changed.
 */
import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { controlClasses } from './Input';

export interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  type?: 'text' | 'number' | 'email';
  className?: string;
  displayValue?: string;
  placeholder?: string;
}

export function EditableCell({
  value,
  onSave,
  type = 'text',
  className,
  displayValue,
  placeholder,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const commit = () => {
    setIsEditing(false);
    let finalValue = editValue;
    if (type === 'number') {
      const n = parseFloat(editValue);
      if (!isNaN(n)) finalValue = String(n);
    }
    if (finalValue !== value) onSave(finalValue);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      commit();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type === 'number' ? 'text' : type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(controlClasses, 'h-8 px-2', type === 'number' && 'text-right tabular-nums', className)}
      />
    );
  }

  const display = displayValue ?? value;

  return (
    // A span with button semantics, not a <button>: cells sit inside clickable rows and cards,
    // and a nested <button> is invalid markup.
    <span
      role="button"
      tabIndex={0}
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        setIsEditing(true);
      }}
      className={cn(
        'max-w-full cursor-text rounded-md px-2 py-1 transition-colors duration-(--dur-quick) hover:bg-surface-hover',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        type === 'number' && 'tabular-nums',
        className
      )}
    >
      {display || <span className="text-placeholder">{placeholder || '—'}</span>}
    </span>
  );
}
