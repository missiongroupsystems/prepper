'use client';

/** The title block and close button shared by Dialog and SidePanel. */
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export function OverlayHeader({
  title,
  description,
  titleId,
  descriptionId,
  onClose,
  className,
  titleClassName,
}: {
  title?: string;
  description?: string;
  titleId: string;
  descriptionId: string;
  /** Omit to hide the close button (a blocking step). */
  onClose?: () => void;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div className={cn('flex shrink-0 items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        {title && (
          <h2 id={titleId} className={cn('font-medium text-ink', titleClassName)}>
            {title}
          </h2>
        )}
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {onClose && (
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close" className="-mt-1 -mr-2 text-tertiary">
          <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

/** The action bar pinned under the scroll area: right-aligned buttons with a 2-unit gap. */
export function OverlayFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-line bg-card px-6 py-4">{children}</div>
  );
}
