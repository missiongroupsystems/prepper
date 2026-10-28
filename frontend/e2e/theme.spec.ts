/**
 * Theme preference (dark mode rebuild).
 * Covers: THEME_BOOT_SCRIPT in src/lib/theme.ts (inline in app/layout.tsx), ThemeProvider and
 * ThemeToggle in src/components/theme/.
 *
 * - A stored choice is stamped on <html> by the inline script, before React hydrates.
 * - Picking a theme in the toggle persists across a reload.
 */
import { test, expect, type Page } from '@playwright/test';

const AUTH_KEY = 'mission_recipes_auth';
const THEME_KEY = 'mission_recipes_theme';
const LEGACY_THEME_KEY = 'prepper-theme';

const MOCK_AUTH = {
  userId: 'theme-user',
  jwt: 'theme.mock.token',
  userType: 'normal',
  refreshToken: 'theme-refresh',
  username: 'themeuser',
  email: 'theme@example.com',
  isManager: false,
  outletId: null,
};

/** Open Settings → Design, retrying the click until React has hydrated the tab bar. */
async function openDesignTab(page: Page) {
  const heading = page.getByRole('heading', { name: 'Mission Recipes design system' });
  await expect(async () => {
    await page.getByRole('tab', { name: 'Design' }).click();
    await expect(heading).toBeVisible({ timeout: 1_000 });
  }).toPass();
}

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Theme', () => {
  test.beforeEach(async ({ page }) => {
    // The mock JWT would 401 against a real backend and log out; keep the test offline.
    await page.route('**/api/v1/**', (route) => route.abort());
  });

  test('applies a stored dark choice before hydration', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate((key) => localStorage.setItem(key, 'dark'), THEME_KEY);

    // Block every client chunk: React never hydrates, so only the inline script can set `.dark`.
    await page.route('**/_next/static/chunks/**', (route) => route.abort());
    await page.reload();

    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe('dark');
  });

  test('reads the pre-rename key before the migration runs', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(
      ({ key, legacyKey }) => {
        localStorage.removeItem(key);
        localStorage.setItem(legacyKey, 'dark');
      },
      { key: THEME_KEY, legacyKey: LEGACY_THEME_KEY }
    );

    await page.route('**/_next/static/chunks/**', (route) => route.abort());
    await page.reload();

    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  });

  test('toggling persists across a reload', async ({ page }) => {
    // Seed the session before any app script runs (as app-shell.spec does): written after /login
    // has loaded, it races the store's auth sync, which can clear it. A fresh context has no
    // stored theme, so the test starts from the light default.
    await page.addInitScript(({ authKey, auth }) => localStorage.setItem(authKey, JSON.stringify(auth)), {
      authKey: AUTH_KEY,
      auth: MOCK_AUTH,
    });

    // The design-system page renders inside Settings → Design (AuthGuard has no /design-system route).
    await page.goto('/settings');
    await openDesignTab(page);
    const html = page.locator('html');
    const group = page.getByRole('radiogroup', { name: 'Theme' }).first();
    await expect(html).not.toHaveClass(/\bdark\b/);
    await expect(group.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');

    await group.getByRole('radio', { name: 'Dark' }).click();
    await expect(html).toHaveClass(/\bdark\b/);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe('dark');

    await page.reload();
    await expect(html).toHaveClass(/\bdark\b/);
    await openDesignTab(page);
    await expect(group.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');

    await group.getByRole('radio', { name: 'Light' }).click();
    await expect(html).not.toHaveClass(/\bdark\b/);
    await page.reload();
    await expect(html).not.toHaveClass(/\bdark\b/);
  });
});
