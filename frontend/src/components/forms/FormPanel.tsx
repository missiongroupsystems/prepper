'use client';

/**
 * FormPanel — a SidePanel holding one form. Create flows get Cancel + a pending submit in the
 * footer; the footer button submits the form through its `form` attribute, so Enter in a field
 * works too. Edit flows autosave field by field and pass `doneLabel` instead: one button that
 * closes the panel, never a Save.
 */
import { useId, type FormEvent, type ReactNode } from 'react';
import { Button, PendingButton, SidePanel } from '@/components/ui';

interface FormPanelBaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'md' | 'lg';
  children: ReactNode;
}

interface CreatePanelProps extends FormPanelBaseProps {
  onSubmit: () => void;
  submitLabel: string;
  pending: boolean;
  doneLabel?: never;
}

interface EditPanelProps extends FormPanelBaseProps {
  /** Edits autosave; the footer only closes. */
  doneLabel: string;
  onSubmit?: never;
  submitLabel?: never;
  pending?: never;
}

export function FormPanel(props: CreatePanelProps | EditPanelProps) {
  const { open, onClose, title, description, size, children } = props;
  const formId = useId();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    props.onSubmit?.();
  };

  const footer =
    props.doneLabel !== undefined ? (
      <Button onClick={onClose}>{props.doneLabel}</Button>
    ) : (
      <>
        <Button variant="ghost" onClick={onClose} disabled={props.pending}>
          Cancel
        </Button>
        <PendingButton type="submit" form={formId} pending={props.pending}>
          {props.submitLabel}
        </PendingButton>
      </>
    );

  return (
    <SidePanel
      open={open}
      onClose={props.pending ? () => undefined : onClose}
      title={title}
      description={description}
      size={size}
      footer={footer}
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {children}
      </form>
    </SidePanel>
  );
}
