/**
 * Deleting a dish from its page (admin project — an admin may delete any dish). The dish is
 * mocked, so the test neither needs nor archives real data.
 */
import { test, expect } from '@playwright/test';
import { MOCK_RECIPE_ID, mockRecipe, routeMockRecipe } from './helpers/mockRecipe';

test.describe('Dish delete (/recipes/[id])', () => {
  test('Delete dish asks first, archives the dish and returns to the dish list', async ({ page }) => {
    const deleteCount = await routeMockRecipe(page, mockRecipe());
    await page.goto(`/recipes/${MOCK_RECIPE_ID}`);

    const actions = page.getByRole('button', { name: 'Dish actions' });
    await expect(actions).toBeVisible({ timeout: 15_000 });
    await actions.click();
    await page.getByRole('menuitem', { name: 'Delete dish' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Delete E2E Mock Laksa?');
    await expect(dialog).toContainText(/menu sketches/i);

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    expect(deleteCount()).toBe(0);

    await actions.click();
    await page.getByRole('menuitem', { name: 'Delete dish' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete dish' }).click();

    await page.waitForURL(/\/recipes$/, { timeout: 10_000 });
    expect(deleteCount()).toBe(1);
  });

  test('an archived dish offers Restore instead of Delete', async ({ page }) => {
    await routeMockRecipe(page, mockRecipe({ status: 'archived' }));
    await page.goto(`/recipes/${MOCK_RECIPE_ID}`);

    const actions = page.getByRole('button', { name: 'Dish actions' });
    await expect(actions).toBeVisible({ timeout: 15_000 });
    await actions.click();
    await expect(page.getByRole('menuitem', { name: 'Restore dish' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete dish' })).toHaveCount(0);
  });
});
