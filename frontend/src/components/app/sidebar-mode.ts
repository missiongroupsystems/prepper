/**
 * The rail's mode — Expanded (232px, labels) or Collapsed (64px, icons with a hover/focus
 * label). A per-browser visual preference, kept in localStorage like the theme. The no-flash
 * script in app/layout.tsx stamps `<html data-sidebar>` before paint, and `styles/shell.css`
 * decides what shows from it, so a reload never flashes the wide rail and nothing re-renders.
 *
 * Nothing stored, or anything unrecognised, means Expanded.
 */
import { SIDEBAR_STORAGE_KEY } from '@/lib/storage-keys';

export const SIDEBAR_MODES = ['expanded', 'collapsed'] as const;
export type SidebarMode = (typeof SIDEBAR_MODES)[number];

export const DEFAULT_SIDEBAR_MODE: SidebarMode = 'expanded';

export function readSidebarMode(raw: string | null | undefined): SidebarMode {
  return SIDEBAR_MODES.find((mode) => mode === raw) ?? DEFAULT_SIDEBAR_MODE;
}

/** Body of the no-flash script. Mirrors `readSidebarMode`; storage blocked keeps the default. */
export const SIDEBAR_BOOT_SCRIPT =
  `try{var s=localStorage.getItem('${SIDEBAR_STORAGE_KEY}');` +
  "document.documentElement.dataset.sidebar=s==='collapsed'?s:'expanded'}catch(e){}";

/** Apply a mode now and remember it for this browser. */
export function applySidebarMode(mode: SidebarMode): void {
  document.documentElement.dataset.sidebar = mode;
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, mode);
  } catch {
    // Storage blocked: the choice holds for this page, it just won't persist.
  }
}
