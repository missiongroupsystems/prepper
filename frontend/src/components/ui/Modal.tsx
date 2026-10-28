'use client';

/**
 * Modal — the pre-redesign API kept for existing callers, now a thin wrapper over Dialog (focus
 * trap, Escape, scroll lock, focus return, portal). New create/edit/detail flows should use
 * SidePanel; confirmations use ConfirmModal. Pass action buttons in `footer` so they pin under
 * the scroll area instead of sitting inline in the body.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Dialog } from './Dialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Max width class for the modal. Defaults to 'max-w-md'. */
  maxWidth?: string;
  /** Max height class for the modal. Defaults to 'max-h-[90vh]'. */
  maxHeight?: string;
  /** When true, blocks backdrop click and Escape, and hides the close button. */
  disableClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-md',
  maxHeight = 'max-h-[90vh]',
  disableClose = false,
}: ModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={footer}
      dismissible={!disableClose}
      className={cn(maxWidth, maxHeight)}
    >
      {children}
    </Dialog>
  );
}
