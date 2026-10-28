'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared behaviour for the shell's two overlays (the account menu and the phone menu sheet):
 * Escape and a press outside close it, focus moves inside on open and returns to whatever had
 * it on close. `lockScroll` also stops the page scrolling under a full-height sheet.
 *
 * `ignore` is the trigger: a press on it toggles the overlay itself, so it must not also count
 * as "outside".
 */
export function useDismiss<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
  { ignore, lockScroll = false }: { ignore?: RefObject<HTMLElement | null>; lockScroll?: boolean } = {}
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const container = ref.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    container?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onCloseRef.current();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (container?.contains(target) || ignore?.current?.contains(target)) return;
      onCloseRef.current();
    };
    const previousOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
      if (lockScroll) document.body.style.overflow = previousOverflow;
      // Return focus only if it is still inside (a click outside already moved it on purpose).
      if (!container || container.contains(document.activeElement) || document.activeElement === document.body) {
        previouslyFocused?.focus({ preventScroll: true });
      }
    };
  }, [open, ignore, lockScroll]);

  return ref;
}
