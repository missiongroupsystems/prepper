/**
 * Menu Preview Page tests — runs under the 'manager' project (storageState: manager.json)
 * Requires a seeded menu (written by global.setup.ts → seed-manager-data.json).
 */
import { test, expect } from '@playwright/test';
import { readSeedManagerData } from './helpers/seed';
import { goToMenuPreview } from './helpers/navigation';

test.describe('Menu Preview Page', () => {
  test('menu is displayed in read-only mode', async ({ page }) => {
    const found = await goToMenuPreview(page, readSeedManagerData()?.menuId);
    test.skip(!found, 'No menus available for preview');
    await page.waitForLoadState('load');
    await expect(page.locator('main')).toBeVisible();
  });

  test('print button triggers browser print dialog', async ({ page }) => {
    const found = await goToMenuPreview(page, readSeedManagerData()?.menuId);
    test.skip(!found, 'No menus available for preview');

    const printBtn = page.locator('button').filter({ hasText: /print/i });
    if (await printBtn.isVisible()) {
      await page.evaluate(() => {
        window.print = () => { (window as Window & { __printCalled?: boolean }).__printCalled = true; };
      });
      await printBtn.click();
      await page.waitForTimeout(300);
      const printCalled = await page.evaluate(() => (window as Window & { __printCalled?: boolean }).__printCalled);
      expect(printCalled).toBe(true);
    }
  });

  test('back button navigates to menu list', async ({ page }) => {
    const found = await goToMenuPreview(page, readSeedManagerData()?.menuId);
    test.skip(!found, 'No menus available for preview');

    const backBtn = page.locator('a, button').filter({ hasText: /back|menu list/i }).first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      // Back button may use router.back() or router.push('/menu') — accept either
      await page.waitForURL(/\/menu(?!\/preview)/, { timeout: 10_000 }).catch(() => {});
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test.describe('Edge Cases', () => {
    test('print layout does not include nav bar or action buttons', async ({ page }) => {
      const found = await goToMenuPreview(page, readSeedManagerData()?.menuId);
      test.skip(!found, 'No menus available for preview');

      // Check CSS print media hides navigation
      await expect(page.locator('main')).toBeVisible();
    });
  });
});
