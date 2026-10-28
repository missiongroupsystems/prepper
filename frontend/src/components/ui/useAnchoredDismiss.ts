'use client';

/**
 * Dismissal for a NON-MODAL anchored overlay — Menu and Select's list. Not `useOverlay`: these
 * float beside the page, so the page keeps scrolling and nothing traps focus.
 *
 * Two dismissals, deliberately different: a pointerdown outside closes WITHOUT returning focus
 * (the user already put it somewhere); Escape closes AND returns focus to the trigger.
 *
 * ONE ESCAPE CLOSES ONE THING. A menu inside a SidePanel must close itself and leave the panel
 * open. React's root listener runs before the panel's `document` listener, so the returned
 * `onKeyDown` (spread on the wrapper around trigger and list) calls `stopImmediatePropagation`.
 * The `document` listener is the fallback for an Escape pressed with focus outside the wrapper.
 */
import { useCallback, useEffect, type KeyboardEvent, type RefObject } from 'react';

/** Stops every later `document` keydown listener, so an enclosing overlay does not also close. */
export function swallowEscape(e: KeyboardEvent): void {
  e.preventDefault();
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
}

export function useAnchoredDismiss({
  open,
  triggerRef,
  panelRef,
  onPointerOutside,
  onEscape,
}: {
  open: boolean;
  /** The control that opened it — a pointerdown on it must not dismiss, or it cannot toggle. */
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  onPointerOutside: () => void;
  onEscape: () => void;
}): { onKeyDown: (e: KeyboardEvent) => void } {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onPointerOutside();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, triggerRef, panelRef, onPointerOutside, onEscape]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open || e.key !== 'Escape') return;
      swallowEscape(e);
      onEscape();
    },
    [open, onEscape]
  );
  return { onKeyDown };
}
