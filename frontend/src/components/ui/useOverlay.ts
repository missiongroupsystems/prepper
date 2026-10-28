'use client';

/**
 * Modal overlay behaviour shared by Dialog and SidePanel (§12.6, §15) — the one place these live,
 * so a new overlay cannot ship without them:
 *
 * - Escape closes (bound on the document, so it works before focus has moved in).
 * - Body scroll is locked with a COUNTER on `<html data-scroll-locked>`: a confirm can open over a
 *   panel, and the lock must survive the inner one closing.
 * - Focus moves to the first `[autofocus]` inside, else the first focusable, else the container;
 *   Tab and Shift+Tab wrap inside; on close focus returns to whatever had it before (the trigger).
 * - Overlays STACK: only the top one handles keys, so one Escape closes the confirm and leaves the
 *   panel under it standing.
 *
 * `dismissible: false` keeps the trap and lock but ignores Escape — for a blocking step.
 */
import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const LOCK_ATTR = 'data-scroll-locked';
let lockCount = 0;

/** Open overlays, bottom → top. Only the last entry responds to Escape and Tab. */
const stack: symbol[] = [];

function acquireScrollLock(): () => void {
  lockCount += 1;
  document.documentElement.setAttribute(LOCK_ATTR, '');
  return () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) document.documentElement.removeAttribute(LOCK_ATTR);
  };
}

function trapTab(e: KeyboardEvent, container: HTMLElement) {
  const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
  if (focusables.length === 0) {
    e.preventDefault();
    container.focus();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !container.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !container.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

export function useOverlay(open: boolean, onClose: () => void, dismissible = true) {
  const containerRef = useRef<HTMLDivElement>(null);
  // The latest close handler, read through a ref rather than listed as a dependency: callers pass
  // an inline `() => setOpen(false)`, and as a dependency it would tear the effect down (and move
  // focus) on every render of the overlay. (Next 15's bundled React has no `useEffectEvent`.)
  const closeRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  useEffect(() => {
    closeRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const releaseLock = acquireScrollLock();
    const id = Symbol('overlay');
    stack.push(id);
    const isTop = () => stack[stack.length - 1] === id;

    // Initial focus after paint, so the entrance animation does not fight scroll-into-view.
    const raf = window.requestAnimationFrame(() => {
      if (!container) return;
      const preferred = container.querySelector<HTMLElement>('[autofocus]');
      const first = container.querySelector<HTMLElement>(FOCUSABLE);
      (preferred ?? first ?? container).focus({ preventScroll: true });
    });

    const onKey = (e: KeyboardEvent) => {
      if (!isTop()) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (dismissibleRef.current) closeRef.current();
        return;
      }
      if (e.key === 'Tab' && container) trapTab(e, container);
    };
    document.addEventListener('keydown', onKey);

    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      const at = stack.indexOf(id);
      if (at !== -1) stack.splice(at, 1);
      releaseLock();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  return containerRef;
}
