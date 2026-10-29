/** Who may change a dish: its owner or an admin. Presentation only — the API decides too. */
import type { Recipe } from '@/types';

export function canEditRecipe(
  recipe: Pick<Recipe, 'owner_id'>,
  userId: string | null,
  userType: 'normal' | 'admin' | null
): boolean {
  return userType === 'admin' || (userId !== null && recipe.owner_id === userId);
}
