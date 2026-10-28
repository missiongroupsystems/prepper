'use client';

/**
 * ConfirmModal — THE confirm path every destructive action must use. A small (`sm`) Dialog: the
 * title names the action, the message says what happens, Cancel on the left of the confirm.
 * `variant="destructive"` turns the confirm into the danger button — never the accent. Pass
 * `pending` while the action runs to keep the dialog open with a busy, fixed-width confirm.
 */
import { Dialog } from './Dialog';
import { Button } from './Button';
import { PendingButton } from './PendingButton';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  pending?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  pending = false,
}: ConfirmModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={title}
      description={message}
      size="sm"
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <PendingButton
            variant={variant === 'destructive' ? 'danger' : 'primary'}
            onClick={onConfirm}
            pending={pending}
          >
            {confirmLabel}
          </PendingButton>
        </>
      }
    />
  );
}
