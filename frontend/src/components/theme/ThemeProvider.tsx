'use client';

/**
 * Theme provider + `useTheme()` — System · Light · Dark, persisted under THEME_STORAGE_KEY.
 *
 * The no-flash script in `app/layout.tsx` (lib/theme.ts) stamps `.dark` before first paint and
 * follows the OS for System, so this provider never applies the theme on mount — doing so from
 * the server snapshot would flash Light on hydration. It applies only when the choice changes:
 * here via `setChoice`, or in another tab via the `storage` event.
 *
 * localStorage and the OS query are external stores, read with `useSyncExternalStore`; the
 * server snapshot is the default choice, and React re-renders with the real one after hydrating.
 */
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import {
  DEFAULT_THEME_CHOICE,
  PREFERS_DARK_QUERY,
  applyResolvedTheme,
  parseThemeChoice,
  resolveTheme,
  type ResolvedTheme,
  type ThemeChoice,
} from '@/lib/theme';
import { THEME_STORAGE_KEY } from '@/lib/storage-keys';

/** Same-tab notification; `storage` events only fire in other tabs. */
const THEME_CHANGE_EVENT = 'mission-recipes:theme-change';

interface ThemeContextValue {
  choice: ThemeChoice;
  resolvedTheme: ResolvedTheme;
  setChoice: (choice: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readChoice(): ThemeChoice {
  try {
    return parseThemeChoice(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME_CHOICE;
  }
}

const readPrefersDark = () => window.matchMedia(PREFERS_DARK_QUERY).matches;

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(PREFERS_DARK_QUERY);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    applyResolvedTheme(resolveTheme(readChoice(), query.matches));
    onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  query.addEventListener('change', onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    query.removeEventListener('change', onChange);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const choice = useSyncExternalStore(subscribe, readChoice, () => DEFAULT_THEME_CHOICE);
  const prefersDark = useSyncExternalStore(subscribe, readPrefersDark, () => false);

  const setChoice = useCallback((next: ThemeChoice) => {
    applyResolvedTheme(resolveTheme(next, readPrefersDark()));
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode, quota) — the theme applies for this page only.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ choice, resolvedTheme: resolveTheme(choice, prefersDark), setChoice }),
    [choice, prefersDark, setChoice]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
