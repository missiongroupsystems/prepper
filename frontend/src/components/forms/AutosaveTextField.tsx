'use client';

/**
 * A labelled text field that saves itself on blur (and on Enter for a single line). No Save
 * button: the value is committed when the cook moves on, a required field that is emptied shows
 * its error and keeps the last saved value on the server.
 */
import { useEffect, useState, type KeyboardEvent } from 'react';
import { Input, Textarea } from '@/components/ui';
import { FormField, fieldA11y } from './FormField';

export function AutosaveTextField({
  id,
  label,
  value,
  onCommit,
  required,
  multiline,
  placeholder,
}: {
  id: string;
  label: string;
  /** The saved value. */
  value: string;
  /** Called with the trimmed value when it differs from `value`. */
  onCommit: (next: string) => void;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string>();

  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    const next = draft.trim();
    if (required && !next) {
      setError(`${label} is required`);
      return;
    }
    setError(undefined);
    if (next !== value) onCommit(next);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
  };

  const common = {
    ...fieldA11y(id, error),
    value: draft,
    placeholder,
    onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown,
  };

  return (
    <FormField id={id} label={label} optional={!required} error={error}>
      {multiline ? <Textarea {...common} rows={3} /> : <Input {...common} />}
    </FormField>
  );
}
