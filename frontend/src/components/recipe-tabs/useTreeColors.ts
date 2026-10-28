'use client';

/**
 * The version tree's edge and grid colours, read from the live design tokens so the tree follows
 * light and dark. ReactFlow folds the marker colour into the marker's element id, so it must be a
 * resolved value (a `var(...)` would break the `url(#id)` reference) — hence computed styles.
 *
 * Re-read whenever `<html>`'s class changes, which is how the theme is applied: that catches the
 * toggle, another tab, and the OS switching under "System", after the class has actually landed.
 */
import { useMemo, useSyncExternalStore } from 'react';

export interface TreeColors {
  edge: string;
  grid: string;
}

const EDGE_TOKEN = '--muted';
const GRID_TOKEN = '--hairline';
const SEPARATOR = '|';
/** Empty on the server, so ReactFlow falls back to its defaults; the tree only draws on the client. */
const SERVER_SNAPSHOT = SEPARATOR;

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

/** A string, so an unchanged theme returns an identical snapshot and nothing re-renders. */
function readSnapshot(): string {
  const styles = getComputedStyle(document.documentElement);
  return [EDGE_TOKEN, GRID_TOKEN].map((token) => styles.getPropertyValue(token).trim()).join(SEPARATOR);
}

export function useTreeColors(): TreeColors {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => SERVER_SNAPSHOT);
  return useMemo(() => {
    const [edge, grid] = snapshot.split(SEPARATOR);
    return { edge, grid };
  }, [snapshot]);
}
