/**
 * Legacy localStorage key migration (Prepper -> Mission Recipes rename).
 * Covers: migrateLegacyStorageKeys() in src/lib/storage-keys.ts, run on client load.
 *
 * Existing users have auth / theme saved under the pre-rename keys. On the first
 * load after the rename the values must move to the new keys and the old keys
 * must be removed, so nobody is logged out.
 */
import { test, expect, type Page } from '@playwright/test';

const LEGACY_AUTH_KEY = 'prepper_auth';
const LEGACY_THEME_KEY = 'prepper-theme';
const AUTH_KEY = 'mission_recipes_auth';
const THEME_KEY = 'mission_recipes_theme';

const LEGACY_AUTH = {
  userId: 'legacy-user',
  jwt: 'legacy.mock.token',
  userType: 'normal',
  refreshToken: 'legacy-refresh',
  username: 'legacyuser',
  email: 'legacy@example.com',
  isManager: false,
  outletId: null,
};
const LEGACY_THEME = 'light';

// Start unauthenticated so only the seeded legacy keys are present
test.use({ storageState: { cookies: [], origins: [] } });

/** Read a set of localStorage keys in one round trip. */
function readKeys(page: Page, keys: string[]) {
  return page.evaluate(
    (ks) => Object.fromEntries(ks.map((k) => [k, localStorage.getItem(k)])),
    keys
  );
}

test.describe('Legacy storage key migration', () => {
  test.beforeEach(async ({ page }) => {
    // The mock JWT would 401 against a real backend and trigger a logout that
    // clears the auth key. Abort API calls so the test only observes the migration.
    await page.route('**/api/v1/**', (route) => route.abort());
    await page.goto('/login');
  });

  test('moves prepper_auth and prepper-theme to the new keys and removes the old ones', async ({ page }) => {
    await page.evaluate(
      ({ legacyAuthKey, legacyThemeKey, authKey, themeKey, auth, theme }) => {
        localStorage.removeItem(authKey);
        localStorage.removeItem(themeKey);
        localStorage.setItem(legacyAuthKey, JSON.stringify(auth));
        localStorage.setItem(legacyThemeKey, theme);
      },
      {
        legacyAuthKey: LEGACY_AUTH_KEY,
        legacyThemeKey: LEGACY_THEME_KEY,
        authKey: AUTH_KEY,
        themeKey: THEME_KEY,
        auth: LEGACY_AUTH,
        theme: LEGACY_THEME,
      }
    );

    await page.reload();

    await expect
      .poll(() => readKeys(page, [LEGACY_AUTH_KEY, LEGACY_THEME_KEY, THEME_KEY]))
      .toEqual({ [LEGACY_AUTH_KEY]: null, [LEGACY_THEME_KEY]: null, [THEME_KEY]: LEGACY_THEME });

    const migratedAuth = await page.evaluate((key) => localStorage.getItem(key), AUTH_KEY);
    expect(migratedAuth).not.toBeNull();
    expect(JSON.parse(migratedAuth as string)).toEqual(LEGACY_AUTH);
  });

  test('keeps an existing new key and drops the stale legacy value', async ({ page }) => {
    const currentTheme = 'current-theme';
    await page.evaluate(
      ({ legacyThemeKey, themeKey, current }) => {
        localStorage.setItem(themeKey, current);
        localStorage.setItem(legacyThemeKey, 'stale-theme');
      },
      { legacyThemeKey: LEGACY_THEME_KEY, themeKey: THEME_KEY, current: currentTheme }
    );

    await page.reload();

    await expect
      .poll(() => readKeys(page, [LEGACY_THEME_KEY, THEME_KEY]))
      .toEqual({ [LEGACY_THEME_KEY]: null, [THEME_KEY]: currentTheme });
  });
});
