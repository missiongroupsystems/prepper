/**
 * The labelled field grid on a catalogue detail page: label above value, two columns from `sm`.
 * Values are usually `EditableCell`s (autosave), pulled left by their own padding so the text
 * lines up with the label.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Pulls an `EditableCell` left by its own `px-2` so its text sits under the label. */
export const inlineEditClasses = '-ml-2 inline-block';

export function DetailList({ className, children }: { className?: string; children: ReactNode }) {
  return <dl className={cn('grid gap-x-8 gap-y-5 sm:grid-cols-2', className)}>{children}</dl>;
}

export function DetailField({
  label,
  hint,
  wide,
  children,
}: {
  label: string;
  /** A short muted note after the label, e.g. why the field is locked. */
  hint?: string;
  /** Span both columns. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', wide && 'sm:col-span-2')}>
      <dt className="text-[13px] leading-5 font-medium text-muted-foreground">
        {label}
        {hint && <span className="ml-2 font-normal text-tertiary">{hint}</span>}
      </dt>
      <dd className="min-w-0 text-sm text-ink">{children}</dd>
    </div>
  );
}

export function RecordTimestamps({ createdAt, updatedAt }: { createdAt: string; updatedAt: string }) {
  return (
    <p className="border-t border-line pt-4 text-sm text-tertiary">
      Created {new Date(createdAt).toLocaleDateString()}
      {updatedAt !== createdAt && ` · Updated ${new Date(updatedAt).toLocaleDateString()}`}
    </p>
  );
}
