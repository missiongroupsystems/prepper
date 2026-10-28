/**
 * Form building blocks for create and edit panels (§11): a labelled field with its hint and
 * error, and a titled group of fields. The control itself is the caller's — spread
 * `fieldA11y(id, error)` onto it so the label, the error and `aria-invalid` are wired up.
 */
import type { ReactNode } from 'react';
import { FieldError, FieldHint, Label } from '@/components/ui';
import { cn } from '@/lib/utils';

const errorId = (id: string) => `${id}-error`;
const hintId = (id: string) => `${id}-hint`;

/** The props a control needs to point at its FormField's label, hint and error. */
export function fieldA11y(id: string, error?: string, hint?: boolean) {
  const describedBy = [error && errorId(id), hint && hintId(id)].filter(Boolean).join(' ');
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  } as const;
}

export function FormField({
  id,
  label,
  optional,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  /** Appends "(optional)" — required is the default, so it is the optional field that is marked. */
  optional?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-tertiary"> (optional)</span>}
      </Label>
      {children}
      {hint && <FieldHint id={hintId(id)}>{hint}</FieldHint>}
      {error && <FieldError id={errorId(id)}>{error}</FieldError>}
    </div>
  );
}

/** A titled group of fields inside a panel. Groups after the first get a hairline above. */
export function FormSection({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: string;
  description?: string;
  /** A small control on the group's title row, e.g. "Add supplier". */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('flex flex-col gap-4 [&+&]:border-t [&+&]:border-line [&+&]:pt-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-sm font-medium text-ink">{title}</h3>
          {description && <p className="text-sm text-tertiary">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** Two fields side by side from `sm`, stacked on a phone. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}
