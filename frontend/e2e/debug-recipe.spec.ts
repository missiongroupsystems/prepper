/**
 * Debug helper — prints recipe links found on the list page.
 * Only run this manually when diagnosing navigation issues in CI.
 * Excluded from regular test runs via the `debug-` prefix convention.
 *
 * To run: npx playwright test e2e/debug-recipe.spec.ts
 */
import { test } from '@playwright/test';

test.skip(true, 'Debug-only — run manually when needed');

test('debug: print recipe links visible on /recipes', async ({ page }) => {
  await page.goto('/recipes');
  await page.waitForLoadState('load');
  const links = await page.locator('a[href]').evaluateAll((els) =>
    (els as HTMLAnchorElement[])
      .filter((el) => /\/recipes\//.test(el.getAttribute('href') || ''))
      .map((el) => el.getAttribute('href'))
  );
  console.log('Recipe links found:', JSON.stringify(links));
  const bodyText = await page.locator('body').textContent();
  console.log('Page body (first 500):', bodyText?.substring(0, 500));
});
