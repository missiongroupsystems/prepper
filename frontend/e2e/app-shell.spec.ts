/**
 * App shell: the collapsible rail, the phone menu sheet, and the auth pages that render bare.
 * Covers: components/app/ (AppShell, AppSidebar, MobileMenu, sidebar-mode.ts) and the
 * SIDEBAR_BOOT_SCRIPT inlined in app/layout.tsx.
 *
 * Runs offline: a mock session in localStorage, every API call aborted.
 */
import { test, expect, type Page } from '@playwright/test';

const AUTH_KEY = 'mission_recipes_auth';
const SIDEBAR_KEY = 'mission_recipes_sidebar';
const LAST_ROUTE_KEY = 'mission_recipes_last_route';
const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 375, height: 812 };

const MOCK_AUTH = {
  userId: 'shell-user',
  jwt: 'shell.mock.token',
  userType: 'normal',
  refreshToken: 'shell-refresh',
  username: 'Shell User',
  email: 'shell@example.com',
  isManager: false,
  outletId: null,
};

/**
 * Open a page signed in. AuthGuard bounces a cold load of a protected route through /login and
 * back to the stored last route, so both are seeded before any page script runs.
 */
async function openSignedIn(page: Page, path: string) {
  await page.addInitScript(
    ({ authKey, routeKey, auth, target }) => {
      localStorage.setItem(authKey, JSON.stringify(auth));
      localStorage.setItem(routeKey, target);
    },
    { authKey: AUTH_KEY, routeKey: LAST_ROUTE_KEY, auth: MOCK_AUTH, target: path }
  );
  await page.goto(path, { waitUntil: 'commit' });
  await page.waitForURL((url) => url.pathname === path);
}

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('App shell', () => {
  test.beforeEach(async ({ page }) => {
    // The mock JWT would 401 against a real backend and log out; keep the test offline.
    await page.route('**/api/v1/**', (route) => route.abort());
  });

  test('rail shows the nav with the current page marked', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await openSignedIn(page, '/finance');

    const rail = page.getByRole('complementary', { name: 'Sidebar' });
    const nav = rail.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Reports' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Dishes' })).not.toHaveAttribute('aria-current', 'page');
    await expect(rail.getByRole('button', { name: /account menu for shell user/i })).toBeVisible();
  });

  test('a cold load of a protected page stays on it', async ({ page }) => {
    // Regression: AuthGuard redirected before auth hydrated, bouncing through /login and
    // landing on the default route whenever the last route had not been recorded yet.
    // Auth only: no last route is seeded, so a bounce would land on the default route.
    await page.addInitScript(({ key, auth }) => localStorage.setItem(key, JSON.stringify(auth)), {
      key: AUTH_KEY,
      auth: MOCK_AUTH,
    });
    const visited: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) visited.push(new URL(frame.url()).pathname);
    });
    await page.goto('/settings');
    await expect(page.getByRole('navigation', { name: 'Settings tabs' })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/settings');
    expect(visited).not.toContain('/login');
  });

  test('collapsing persists across a reload', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await openSignedIn(page, '/finance');

    const rail = page.getByRole('complementary', { name: 'Sidebar' });
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-sidebar', 'expanded');
    const wide = await rail.boundingBox();

    await rail.getByRole('button', { name: 'Collapse sidebar' }).click();
    await expect(html).toHaveAttribute('data-sidebar', 'collapsed');
    expect(await page.evaluate((key) => localStorage.getItem(key), SIDEBAR_KEY)).toBe('collapsed');

    await page.reload();
    await expect(html).toHaveAttribute('data-sidebar', 'collapsed');
    await expect(rail.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
    await expect.poll(async () => (await rail.boundingBox())?.width).toBeLessThan(wide?.width ?? 0);

    await rail.getByRole('button', { name: 'Expand sidebar' }).click();
    await expect(html).toHaveAttribute('data-sidebar', 'expanded');
  });

  test('the stored mode is stamped before hydration', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/login');
    await page.evaluate((key) => localStorage.setItem(key, 'collapsed'), SIDEBAR_KEY);

    // Block every client chunk: React never hydrates, so only the inline script can stamp it.
    await page.route('**/_next/static/chunks/**', (route) => route.abort());
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-sidebar', 'collapsed');
  });

  test('mobile menu opens and closes', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await openSignedIn(page, '/finance');

    await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeHidden();
    const sheet = page.getByRole('dialog', { name: 'Menu' });

    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('link', { name: 'Reports' })).toHaveAttribute('aria-current', 'page');

    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(sheet).toBeHidden();

    // Navigating from the sheet closes it.
    await page.getByRole('button', { name: 'Open menu' }).click();
    await sheet.getByRole('link', { name: 'Settings' }).click();
    await page.waitForURL(/\/settings$/);
    await expect(sheet).toBeHidden();
  });

  test('mobile touch targets are at least 44px', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await openSignedIn(page, '/finance');

    for (const name of ['Open menu', /account menu for shell user/i, 'Mission Recipes home']) {
      const target = page.getByRole(name === 'Mission Recipes home' ? 'link' : 'button', { name });
      await expect(target).toBeVisible();
      const box = await target.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    }
  });

  for (const path of ['/login', '/register']) {
    test(`${path} renders without the shell`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
      await expect(page.getByRole('complementary', { name: 'Sidebar' })).toHaveCount(0);
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0);
    });
  }

  test('/auth/callback renders without the shell', async ({ page }) => {
    // An OAuth error is the one state the bridge holds on screen rather than redirecting.
    await page.goto('/auth/callback?error=access_denied');
    await expect(page.getByRole('button', { name: 'Back to login' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Sidebar' })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0);
  });

  test('a tasting invite renders without the shell on its way to /login', async ({ page }) => {
    await page.goto('/tastings/invite/123');
    await page.waitForURL(/\/login\?redirect=/);
    await expect(page.getByRole('complementary', { name: 'Sidebar' })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0);
  });
});
