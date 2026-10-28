'use client';

/**
 * Portal — renders an overlay as a child of `<body>`, outside the markup of whatever opened it,
 * so it is never clipped by a scroll container's `overflow` nor inherits a cell's `text-right`.
 * React's tree is unchanged: events and context still bubble through the component that rendered
 * it. On the server there is no `<body>` to portal into, so it renders in place.
 */
import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const subscribe = () => () => {};

export function Portal({ children }: { children: ReactNode }) {
  const canPortal = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  return canPortal ? createPortal(children, document.body) : <>{children}</>;
}
