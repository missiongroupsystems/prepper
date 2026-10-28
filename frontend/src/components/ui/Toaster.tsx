'use client';

/**
 * Toaster — sonner, dressed as Workforce's toast (§12.7, §3.3). Recipes keeps sonner because
 * ~40 files already call `toast.success(...)` / `toast.error(...)`; only the look changes:
 * top-right stack, the popover card with a hairline and the float shadow, a 1.5-stroke semantic
 * icon + sentence-case text (never colour alone), a close button, and errors linger longer.
 *
 * Use toasts for mutation outcomes. A failed page read is an inline error; a field error stays
 * under its field.
 */
import { Toaster as Sonner } from 'sonner';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useTheme } from '@/components/theme';
import { Spinner } from './Spinner';

const DEFAULT_DURATION_MS = 5000;

const ICON_CLASSES = 'size-[18px]';

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      position="top-right"
      theme={resolvedTheme}
      duration={DEFAULT_DURATION_MS}
      closeButton
      icons={{
        success: <CheckCircle2 className={`${ICON_CLASSES} text-success`} strokeWidth={1.5} aria-hidden="true" />,
        error: <AlertCircle className={`${ICON_CLASSES} text-danger`} strokeWidth={1.5} aria-hidden="true" />,
        warning: <AlertTriangle className={`${ICON_CLASSES} text-warning`} strokeWidth={1.5} aria-hidden="true" />,
        info: <Info className={`${ICON_CLASSES} text-info`} strokeWidth={1.5} aria-hidden="true" />,
        loading: <Spinner />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'group flex w-full items-start gap-2.5 rounded-lg bg-popover p-3.5 pr-9 text-ink shadow-pop hairline font-sans',
          icon: 'mt-0.5 shrink-0',
          content: 'flex min-w-0 flex-1 flex-col gap-0.5',
          title: 'text-sm font-normal text-ink',
          description: 'text-[13px] text-muted-foreground',
          actionButton:
            'shrink-0 self-center rounded-full border border-hairline-strong bg-card px-3 py-1 text-[13px] font-medium text-ink transition-colors duration-(--dur-quick) hover:bg-surface-hover',
          cancelButton:
            'shrink-0 self-center rounded-full px-3 py-1 text-[13px] font-medium text-muted-foreground hover:bg-surface-hover',
          closeButton:
            'absolute top-3.5 right-3 grid size-5 place-items-center rounded-full text-tertiary transition-colors duration-(--dur-quick) hover:text-ink [&_svg]:size-3.5',
        },
      }}
    />
  );
}
