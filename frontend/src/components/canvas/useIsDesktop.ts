'use client';

import { useSyncExternalStore } from 'react';

/** Tailwind's `lg` — from here the library is a fixed rail; below it, a drawer. */
const DESKTOP_QUERY = '(min-width: 1024px)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/**
 * Whether the viewport is `lg` or wider. The rail and the drawer must not both mount: each library
 * row registers a dnd-kit draggable, and two with one id break dragging. The server renders the
 * desktop layout.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true
  );
}
