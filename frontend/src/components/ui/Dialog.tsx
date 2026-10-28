'use client';

/**
 * Dialog (§12.6) — the CENTRED overlay, for confirmations and short decisions. Create, edit and
 * detail flows belong in SidePanel: a dialog interrupts, a panel accompanies.
 *
 * Focus-trapped, scroll-locked and Escape-closable through `useOverlay`; closes on backdrop
 * click; returns focus to the trigger. Portalled to `<body>`.
 *
 * Sizes: `sm` 384px for a yes/no (ConfirmModal), `md` 448px, `lg` 672px for the rare dense form
 * that must interrupt. Action buttons go in `footer` — pinned under the scroll area, never inline
 * in the body. `dismissible={false}` blocks Escape, backdrop and the close button.
 */
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useOverlay } from './useOverlay';
import { Portal } from './Portal';
import { OverlayFooter, OverlayHeader } from './OverlayHeader';

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' } as const;

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** One sentence under the title — what the decision is, in plain words. */
  description?: string;
  size?: keyof typeof SIZES;
  /** Action bar pinned outside the scroll area, right-aligned. */
  footer?: ReactNode;
  dismissible?: boolean;
  /** Extra classes for the card — a width or height override. */
  className?: string;
  children?: ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  dismissible = true,
  className,
  children,
}: DialogProps) {
  const ref = useOverlay(open, onClose, dismissible);
  const titleId = useId();
  const descriptionId = useId();

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-[10vh]">
        <div
          className="animate-scrim-in absolute inset-0 scrim"
          onClick={dismissible ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-label={title ? undefined : 'Dialog'}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={cn(
            'animate-fade-in relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-xl bg-card shadow-pop outline-none hairline',
            SIZES[size],
            className
          )}
        >
          {(title || description) && (
            <OverlayHeader
              title={title}
              description={description}
              titleId={titleId}
              descriptionId={descriptionId}
              onClose={dismissible ? onClose : undefined}
              className={cn('px-6 pt-5', !children && 'pb-5')}
              titleClassName="text-lg"
            />
          )}
          {/* `min-h-0` lets this flex item shrink below its content, so the footer stays on the card. */}
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>}
          {footer && <OverlayFooter>{footer}</OverlayFooter>}
        </div>
      </div>
    </Portal>
  );
}
