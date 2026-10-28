/**
 * Overlay keyboard behaviour (Phase 2A primitives), against the showcase at Settings → Design.
 * Covers: Dialog, SidePanel and ConfirmModal via useOverlay (focus in, Tab trap, Escape, focus
 * return) and Menu via useAnchoredDismiss (Escape closes the menu only, focus returns).
 * Offline: a mock session and every API call aborted, so no backend is needed.
 */
import { test, expect, type Page } from '@playwright/test';

const AUTH_KEY = 'mission_recipes_auth';

const MOCK_AUTH = {
  userId: 'overlay-user',
  jwt: 'overlay.mock.token',
  userType: 'normal',
  refreshToken: 'overlay-refresh',
  username: 'overlayuser',
  email: 'overlay@example.com',
  isManager: false,
  outletId: null,
};

test.use({ storageState: { cookies: [], origins: [] } });

async function openShowcase(page: Page) {
  await page.route('**/api/v1/**', (route) => route.abort());
  await page.goto('/login');
  await page.evaluate(({ key, auth }) => localStorage.setItem(key, JSON.stringify(auth)), {
    key: AUTH_KEY,
    auth: MOCK_AUTH,
  });
  await page.goto('/settings');
  const heading = page.getByRole('heading', { name: 'Mission Recipes design system' });
  await expect(async () => {
    await page.getByRole('button', { name: 'Design', exact: true }).click();
    await expect(heading).toBeVisible({ timeout: 1_000 });
  }).toPass();
}

test.describe('Overlays', () => {
  test.beforeEach(async ({ page }) => {
    await openShowcase(page);
  });

  test('side panel: focus moves in, Escape closes, focus returns to the trigger', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open side panel' });
    await trigger.click();

    const panel = page.getByRole('dialog', { name: 'New ingredient' });
    await expect(panel).toBeVisible();
    await expect.poll(() => panel.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('data-scroll-locked', '');

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked', '');
  });

  test('dialog: Tab stays inside the dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Dialog md' }).click();
    const dialog = page.getByRole('dialog', { name: 'Rename recipe' });
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'Dialog md' })).toBeFocused();
  });

  test('confirm modal: Cancel closes and returns focus', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Delete recipe' });
    await trigger.click();
    const confirm = page.getByRole('dialog', { name: 'Delete this recipe?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirm).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('menu: arrows move, Escape closes the menu and returns focus', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Actions', exact: true });
    await trigger.focus();
    await page.keyboard.press('ArrowDown');

    const menu = page.getByRole('menu', { name: 'Recipe actions' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Fork recipe' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: 'Export costing' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
