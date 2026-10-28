'use client';

import { ListOrdered } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { useRecipe } from '@/lib/hooks';
import { Instructions } from '@/components/recipe/Instructions';
import { SectionHeader } from '@/components/app';
import { Card } from '@/components/ui';
import { RecipeTabPage, RecipeTabState } from '@/components/recipe-tabs/RecipeTabPage';

export function InstructionsTab() {
  const { selectedRecipeId, userId, userType } = useAppState();
  const { data: recipe, isLoading, error } = useRecipe(selectedRecipeId);

  const subject = 'its instructions';
  if (!selectedRecipeId) return <RecipeTabState state="unselected" subject={subject} icon={ListOrdered} />;
  if (isLoading) return <RecipeTabState state="loading" subject={subject} />;
  if (error || !recipe) return <RecipeTabState state="error" subject={subject} icon={ListOrdered} />;

  const canEdit = userType === 'admin' || (userId !== null && recipe.owner_id === userId);

  return (
    <RecipeTabPage>
      <SectionHeader
        eyebrow={recipe.name}
        title="Instructions"
        description="Method, timers and temperatures. Changes save as you type."
      />
      <Card>
        <Instructions recipe={recipe} canEdit={canEdit} />
      </Card>
    </RecipeTabPage>
  );
}
