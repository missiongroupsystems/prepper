/**
 * Theme preference — pure and client-safe, so the inline no-flash script in
 * `app/layout.tsx` and the React provider share one rule.
 *
 * Three choices, one default (mirrors Mission Workforce): System · Light · Dark. The dark ramp
 * is hand-tuned, not derived; System only picks which tuned map to show. Nothing stored, or
 * anything unrecognised, means Light.
 */
import { LEGACY_THEME_STORAGE_KEY, THEME_STORAGE_KEY } from './storage-keys';

export const THEME_CHOICES = ['system', 'light', 'dark'] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];
export type ResolvedTheme = 'light' | 'dark';

export const DEFAULT_THEME_CHOICE: ThemeChoice = 'light';

/** The OS preference the System choice follows. */
export const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';

export function parseThemeChoice(stored: string | null | undefined): ThemeChoice {
  return THEME_CHOICES.find((c) => c === stored) ?? DEFAULT_THEME_CHOICE;
}

export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): ResolvedTheme {
  if (choice === 'system') return prefersDark ? 'dark' : 'light';
  return choice;
}

/** Stamp the resolved theme on <html>: the `.dark` class and the UA `color-scheme`. */
export function applyResolvedTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

/**
 * Body of the no-flash script: applies the stored choice before first paint and, for System,
 * keeps following the OS while the page is open. Falls back to the pre-rename key, because
 * `migrateLegacyStorageKeys()` runs only once the client bundle loads. Mirrors
 * `parseThemeChoice` + `resolveTheme` + `applyResolvedTheme`.
 */
export const THEME_BOOT_SCRIPT =
  `try{var k='${THEME_STORAGE_KEY}',l='${LEGACY_THEME_STORAGE_KEY}',` +
  `q=window.matchMedia('${PREFERS_DARK_QUERY}'),a=function(){` +
  'var t=localStorage.getItem(k);if(t===null)t=localStorage.getItem(l);' +
  "var d=t==='dark'||(t==='system'&&q.matches),r=document.documentElement;" +
  "r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light'};" +
  "a();q.addEventListener('change',a)}catch(e){}";
