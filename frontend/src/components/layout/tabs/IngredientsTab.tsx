'use client';

import { Carrot } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { useRecipe, useRecipeIngredients, useSubRecipes, useRecipes } from '@/lib/hooks';
import { SectionHeader } from '@/components/app';
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { RecipeTabPage, RecipeTabState } from '@/components/recipe-tabs/RecipeTabPage';
import { IngredientName } from '@/components/recipe-tabs/IngredientName';

export function IngredientsTab() {
  const { selectedRecipeId } = useAppState();

  const { data: recipe, isLoading: recipeLoading } = useRecipe(selectedRecipeId);
  const { data: ingredients = [], isLoading: ingredientsLoading } = useRecipeIngredients(selectedRecipeId);
  const { data: subRecipes = [], isLoading: subRecipesLoading } = useSubRecipes(selectedRecipeId);
  const { data: allRecipesData } = useRecipes({ page_size: 30 });

  const subject = 'its ingredients';
  if (!selectedRecipeId) return <RecipeTabState state="unselected" subject={subject} icon={Carrot} />;
  if (recipeLoading || ingredientsLoading || subRecipesLoading) {
    return <RecipeTabState state="loading" subject={subject} />;
  }
  if (!recipe) return <RecipeTabState state="error" subject={subject} icon={Carrot} />;

  const recipeNames = new Map(allRecipesData?.items.map((r) => [r.id, r.name]));
  const sortedSubRecipes = [...subRecipes].sort((a, b) => a.position - b.position);
  const isEmpty = ingredients.length === 0 && sortedSubRecipes.length === 0;

  return (
    <RecipeTabPage>
      <SectionHeader eyebrow={recipe.name} title="Ingredients" description="What goes into one batch." />

      {isEmpty ? (
        <EmptyState
          icon={Carrot}
          title="No ingredients yet"
          description="Drag ingredients or other recipes onto the canvas tab to build this recipe."
        />
      ) : (
        <>
          <Table framed aria-label="Base ingredients">
            <TableHeader>
              <TableRow>
                <TableHead>Base ingredient</TableHead>
                <TableHead numeric>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.length === 0 && <TableEmpty colSpan={2}>No base ingredients</TableEmpty>}
              {ingredients.map((ri) => (
                <TableRow key={ri.id}>
                  <TableCell>
                    <IngredientName name={ri.ingredient?.name ?? `Ingredient #${ri.ingredient_id}`} />
                  </TableCell>
                  <TableCell numeric>
                    {ri.quantity} {ri.unit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Table framed aria-label="Sub-recipes">
            <TableHeader>
              <TableRow>
                <TableHead>Sub-recipe</TableHead>
                <TableHead numeric>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSubRecipes.length === 0 && <TableEmpty colSpan={2}>No sub-recipes</TableEmpty>}
              {sortedSubRecipes.map((sr) => (
                <TableRow key={sr.id}>
                  <TableCell>{recipeNames.get(sr.child_recipe_id) ?? `Recipe #${sr.child_recipe_id}`}</TableCell>
                  <TableCell numeric>
                    {sr.quantity} {sr.unit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </RecipeTabPage>
  );
}
