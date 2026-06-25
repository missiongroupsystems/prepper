'use client';

import { useState, useRef, useEffect } from 'react';

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
  className = '',
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

  const handleBlur = () => {
    setIsEditing(false);
    let finalValue = editValue;
    if (type === 'number') {
      const n = parseFloat(editValue);
      if (!isNaN(n)) finalValue = String(n);
    }
    if (finalValue !== value) {
      onSave(finalValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
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
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-1 py-0.5 text-sm border border-purple-400 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 bg-card ${className}`}
      />
    );
  }

  const display = displayValue ?? value;

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-secondary px-1 py-0.5 rounded ${className}`}
    >
      {display || <span className="text-muted-foreground italic">{placeholder || '-'}</span>}
    </span>
  );
}
