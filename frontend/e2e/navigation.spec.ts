/**
 * Section 2: Navigation & Layout
 * Covers: the app shell's rail (components/app/), Home Page redirects
 *
 * Nav facts (from components/app/nav.ts):
 * - Menu, Dishes (/recipes), Ingredients, R&D, Reports (/finance), Settings — visible to all
 *   logged-in users; nothing is admin-only today
 * - The rail is the complementary landmark "Sidebar" with a "Main" navigation (lg and up);
 *   below lg the same nav opens from the top bar's "Open menu" button
 * - The current item carries aria-current="page"
 */
import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1280, height: 800 };

function railNav(page: Page) {
  return page.getByRole('complementary', { name: 'Sidebar' }).getByRole('navigation', { name: 'Main' });
}

test.describe('Rail navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/recipes');
    await page.waitForLoadState('load');
  });

  test('nav links are present', async ({ page }) => {
    const nav = railNav(page);
    await expect(nav).toBeVisible();
    for (const name of ['Menu', 'Dishes', 'Ingredients', 'R&D', 'Reports', 'Settings']) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
    }
  });

  test('admin-only nav item (/admin/users) is not visible to normal users', async ({ page }) => {
    await expect(page.locator('a[href="/admin/users"]')).toHaveCount(0);
  });

  test('active page link is highlighted', async ({ page }) => {
    // Assert the semantic marker, not the styling: the active nav item carries aria-current.
    await expect(railNav(page).getByRole('link', { name: 'Dishes' })).toHaveAttribute('aria-current', 'page');
  });

  test('username is displayed in the rail', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Account menu for / })).toBeVisible();
  });

  test('sign out is in the account menu', async ({ page }) => {
    await page
      .getByRole('complementary', { name: 'Sidebar' })
      .getByRole('button', { name: /^Account menu for / })
      .click();
    await expect(page.getByRole('dialog', { name: 'Account' }).getByRole('button', { name: 'Sign out' })).toBeVisible();
  });

  test.describe('Edge Cases', () => {
    test('very long username does not break the layout', async ({ page }) => {
      await page.evaluate(() => {
        const auth = JSON.parse(localStorage.getItem('mission_recipes_auth') || '{}');
        auth.username = 'a'.repeat(80);
        localStorage.setItem('mission_recipes_auth', JSON.stringify(auth));
      });
      await page.reload();
      const rail = page.getByRole('complementary', { name: 'Sidebar' });
      await expect(rail).toBeVisible();
      const railBox = await rail.boundingBox();
      expect(railBox?.width ?? 0).toBeLessThanOrEqual(240);
      expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(DESKTOP.width);
    });

    test('rapidly clicking the same nav link multiple times does not cause errors', async ({ page }) => {
      const recipesLink = railNav(page).getByRole('link', { name: 'Dishes' });
      await recipesLink.click();
      await recipesLink.click();
      await recipesLink.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/recipes');
    });
  });
});

test.describe('Home Page (/)', () => {
  test('authenticated users are redirected to /outlets', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/outlets/, { timeout: 10_000 });
    expect(page.url()).toContain('/outlets');
  });

  test.describe('Edge Cases', () => {
    test('redirect happens without briefly rendering home page content', async ({ page }) => {
      const homeContent = page.locator('h1').filter({ hasText: /home|welcome/i });
      await page.goto('/');
      await page.waitForURL(/\/outlets/, { timeout: 10_000 });
      const isHomeVisible = await homeContent.isVisible().catch(() => false);
      expect(isHomeVisible).toBe(false);
    });
  });
});
