'use client';

/**
 * SidePanel (§12.7) — the right-anchored overlay for CREATE, EDIT and DETAIL flows. A centred
 * dialog hides the record it is about; a panel accompanies it — the list or recipe stays visible
 * on the left while the form works on the right, and a long form gets the height it needs.
 *
 * Same contract as Dialog (`open`, `onClose`, `title`, `size`, `footer`, `children`) so moving
 * between them is an import swap. `md` 576px, `lg` 704px; full width below `sm`. Same overlay
 * behaviour: focus trap, Escape, scroll lock, focus return, backdrop click.
 */
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useOverlay } from './useOverlay';
import { Portal } from './Portal';
import { OverlayFooter, OverlayHeader } from './OverlayHeader';

export interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** One line under the title naming the record or the consequence. */
  description?: string;
  size?: 'md' | 'lg';
  /** Action bar pinned to the bottom, outside the scroll area. Right-aligned. */
  footer?: ReactNode;
  children: ReactNode;
}

export function SidePanel({ open, onClose, title, description, size = 'md', footer, children }: SidePanelProps) {
  const ref = useOverlay(open, onClose);
  const titleId = useId();
  const descriptionId = useId();

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50">
        <div className="animate-scrim-in absolute inset-0 scrim" onClick={onClose} aria-hidden="true" />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={cn(
            'animate-slide-in-right absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-card shadow-pop outline-none',
            size === 'lg' ? 'sm:max-w-[44rem]' : 'sm:max-w-[36rem]'
          )}
        >
          <OverlayHeader
            title={title}
            description={description}
            titleId={titleId}
            descriptionId={descriptionId}
            onClose={onClose}
            className="border-b border-line px-6 py-4"
            titleClassName="text-base"
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <OverlayFooter>{footer}</OverlayFooter>}
        </div>
      </div>
    </Portal>
  );
}
