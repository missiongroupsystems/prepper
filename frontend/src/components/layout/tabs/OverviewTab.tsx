'use client';

import { LayoutDashboard } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { useRecipe, useRecipeIngredients } from '@/lib/hooks';
import { SectionHeader } from '@/components/app';
import { Badge } from '@/components/ui';
import { RecipeTabPage, RecipeTabState } from '@/components/recipe-tabs/RecipeTabPage';
import { OverviewDetails } from '@/components/recipe-tabs/overview/OverviewDetails';
import { OverviewCategories } from '@/components/recipe-tabs/overview/OverviewCategories';
import { OverviewDescription } from '@/components/recipe-tabs/overview/OverviewDescription';
import { OverviewAtAGlance } from '@/components/recipe-tabs/overview/OverviewAtAGlance';
import { OverviewInstructions } from '@/components/recipe-tabs/overview/OverviewInstructions';
import { OverviewTasting } from '@/components/recipe-tabs/overview/OverviewTasting';
import type { RecipeStatus } from '@/types';

const STATUS_BADGES: Record<RecipeStatus, { variant: 'draft' | 'success' | 'warning'; label: string }> = {
  draft: { variant: 'draft', label: 'Draft' },
  active: { variant: 'success', label: 'Active' },
  archived: { variant: 'warning', label: 'Archived' },
};

export function OverviewTab() {
  const { selectedRecipeId, userId, userType } = useAppState();
  const { data: recipe, isLoading, error } = useRecipe(selectedRecipeId);
  const { data: ingredients = [], isLoading: ingredientsLoading } = useRecipeIngredients(selectedRecipeId);

  const subject = 'its overview';
  if (!selectedRecipeId) return <RecipeTabState state="unselected" subject={subject} icon={LayoutDashboard} />;
  if (isLoading || ingredientsLoading) return <RecipeTabState state="loading" subject={subject} />;
  if (error || !recipe) return <RecipeTabState state="error" subject={subject} icon={LayoutDashboard} />;

  const isOwner = userId !== null && recipe.owner_id === userId;
  const status = STATUS_BADGES[recipe.status];
  const ingredientNames = ingredients.flatMap((ri) => (ri.ingredient?.name ? [ri.ingredient.name] : []));

  // Keyed by recipe so local field and disclosure state resets when the recipe changes.
  return (
    <RecipeTabPage key={recipe.id}>
      <SectionHeader
        eyebrow={recipe.name}
        title="Overview"
        actions={
          <>
            <Badge variant={status.variant}>{status.label}</Badge>
            {isOwner && <Badge variant="info">Owned by you</Badge>}
          </>
        }
      />
      <OverviewDetails recipe={recipe} canEdit={isOwner} ingredientNames={ingredientNames} />
      <OverviewCategories recipeId={recipe.id} canEdit={isOwner} />
      <OverviewDescription recipe={recipe} canEdit={isOwner} />
      <OverviewAtAGlance recipe={recipe} ingredients={ingredients} />
      <OverviewInstructions recipe={recipe} />
      <OverviewTasting recipe={recipe} canSummarize={isOwner || userType === 'admin'} />
    </RecipeTabPage>
  );
}
