/**
 * Read-only dishes: a normal user who does not own a dish gets no Dish actions menu, so no way to
 * delete it. The dish is mocked as public and owned by someone else.
 */
import { test, expect } from '@playwright/test';
import { MOCK_RECIPE_ID, mockRecipe, routeMockRecipe } from './helpers/mockRecipe';

test('a dish you do not own has no Dish actions menu', async ({ page }) => {
  await routeMockRecipe(page, mockRecipe());
  await page.goto(`/recipes/${MOCK_RECIPE_ID}`);

  // The recipe tabs past Canvas render only once the dish has loaded.
  const recipeTabs = page.getByRole('navigation', { name: 'Recipe tabs' });
  await expect(recipeTabs.getByRole('button', { name: 'Overview' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Dish actions' })).toHaveCount(0);
});
