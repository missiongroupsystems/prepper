import { test, expect } from '@playwright/test';
import { canEditRecipe } from './recipe';

const OWNER = 'user-owner';

test.describe('canEditRecipe', () => {
  test('the owner can edit', () => {
    expect(canEditRecipe({ owner_id: OWNER }, OWNER, 'normal')).toBe(true);
  });

  test('an admin can edit a dish they do not own', () => {
    expect(canEditRecipe({ owner_id: OWNER }, 'someone-else', 'admin')).toBe(true);
  });

  test('another normal user cannot edit', () => {
    expect(canEditRecipe({ owner_id: OWNER }, 'someone-else', 'normal')).toBe(false);
  });

  test('a signed-out viewer cannot edit, even an ownerless dish', () => {
    expect(canEditRecipe({ owner_id: null }, null, null)).toBe(false);
  });
});
