/**
 * A dish served from a mocked `GET /recipes/:id`, so dish-page tests do not depend on (or change)
 * real data. Only the dish itself is mocked; its sub-resources load from the API as usual.
 */
import type { Page, Route } from '@playwright/test';
import type { Recipe } from '../../src/types';

export const MOCK_RECIPE_ID = 987654;

export function mockRecipe(overrides: Partial<Recipe> = {}): Recipe {
  const now = new Date().toISOString();
  return {
    id: MOCK_RECIPE_ID,
    name: 'E2E Mock Laksa',
    instructions_raw: null,
    instructions_structured: null,
    yield_quantity: 10,
    yield_unit: 'portion',
    cost_price: null,
    selling_price_est: null,
    status: 'draft',
    is_prep_recipe: false,
    is_public: true,
    owner_id: 'e2e-someone-else',
    version: 1,
    root_id: null,
    image_url: null,
    description: null,
    rnd_started: false,
    review_ready: false,
    created_at: now,
    updated_at: now,
    created_by: 'e2e-someone-else',
    ...overrides,
  };
}

/** The dish's own URL — not its `/ingredients`, `/costing` and other sub-resources. */
const RECIPE_URL = new RegExp(`/recipes/${MOCK_RECIPE_ID}(\\?.*)?$`);

/**
 * Serves `recipe` for GET and, for DELETE, archives it (as the API does) and records the call.
 * Returns a getter for how many DELETEs were sent.
 */
export async function routeMockRecipe(page: Page, recipe: Recipe): Promise<() => number> {
  let current = recipe;
  let deletes = 0;
  await page.route(RECIPE_URL, async (route: Route) => {
    const method = route.request().method();
    if (method === 'DELETE') {
      deletes += 1;
      current = { ...current, status: 'archived' };
    }
    if (method === 'GET' || method === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(current) });
      return;
    }
    await route.continue();
  });
  return () => deletes;
}
