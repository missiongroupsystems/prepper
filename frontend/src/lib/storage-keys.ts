/** localStorage keys used by the app. Import these instead of writing literals. */
export const AUTH_STORAGE_KEY = 'mission_recipes_auth';
export const LAST_ROUTE_STORAGE_KEY = 'mission_recipes_last_route';
export const THEME_STORAGE_KEY = 'mission_recipes_theme';
/** Pre-rename theme key; migrated so the dark-mode rebuild can read the user's choice. */
export const LEGACY_THEME_STORAGE_KEY = 'prepper-theme';

/** Keys written before the rename to Mission Recipes, mapped to their replacements. */
const LEGACY_STORAGE_KEYS: ReadonlyArray<readonly [legacyKey: string, newKey: string]> = [
  ['prepper_auth', AUTH_STORAGE_KEY],
  ['prepper_last_route', LAST_ROUTE_STORAGE_KEY],
  [LEGACY_THEME_STORAGE_KEY, THEME_STORAGE_KEY],
];

/**
 * One-time move of pre-rename localStorage values to the new keys, so existing
 * users stay logged in. A legacy value is copied only when the new key is empty,
 * then the legacy key is removed. Safe to call repeatedly.
 */
export function migrateLegacyStorageKeys(): void {
  if (typeof window === 'undefined') return;
  for (const [legacyKey, newKey] of LEGACY_STORAGE_KEYS) {
    try {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue === null) continue;
      if (localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, legacyValue);
      }
      localStorage.removeItem(legacyKey);
    } catch {
      // Storage unavailable (private mode, quota, disabled) — nothing to migrate.
    }
  }
}
