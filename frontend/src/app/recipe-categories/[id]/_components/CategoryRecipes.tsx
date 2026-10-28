'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus, Tags, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAddRecipeToCategory, useRemoveRecipeFromCategory } from '@/lib/hooks';
import {
  Button,
  ConfirmModal,
  EmptyState,
  MenuItem,
  MenuSeparator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { ActionsHead, RecipePickerPanel, RowActionsMenu, type RecipePickerValues } from '@/components/catalogue';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Recipe, RecipeRecipeCategory } from '@/types';

interface CategoryRecipesProps {
  categoryId: number;
  categoryName: string;
  links: RecipeRecipeCategory[];
  recipes: Recipe[];
}

export function CategoryRecipes({ categoryId, categoryName, links, recipes }: CategoryRecipesProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [confirming, setConfirming] = useState<RecipeRecipeCategory | null>(null);
  const addRecipe = useAddRecipeToCategory();
  const removeRecipe = useRemoveRecipeFromCategory();

  const nameOf = (recipeId: number) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    return recipe ? formatDisplayName(recipe.name) : 'Unknown dish';
  };
  const addedIds = new Set(links.map((l) => l.recipe_id));
  const recipeOptions = recipes
    .filter((r) => !addedIds.has(r.id))
    .map((r) => ({ value: String(r.id), label: formatDisplayName(r.name) }));

  const handleAdd = async ({ recipeId }: RecipePickerValues) => {
    try {
      await addRecipe.mutateAsync({ recipe_id: recipeId, category_id: categoryId });
      toast.success(`${nameOf(recipeId)} added to ${categoryName}`);
      return true;
    } catch {
      toast.error('Failed to add the dish');
      return false;
    }
  };

  const handleRemove = () => {
    if (!confirming) return;
    removeRecipe.mutate(
      { linkId: confirming.id, categoryId: confirming.category_id, recipeId: confirming.recipe_id },
      {
        onSuccess: () => toast.success(`${nameOf(confirming.recipe_id)} removed from ${categoryName}`),
        onError: () => toast.error('Failed to remove the dish'),
        onSettled: () => setConfirming(null),
      }
    );
  };

  const addButton = (
    <Button variant="secondary" onClick={() => setPanelOpen(true)}>
      <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      Add dish
    </Button>
  );

  return (
    <section className="flex flex-col gap-3" aria-labelledby="category-recipes">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="category-recipes" className="text-lg">
          Dishes
        </h2>
        {links.length > 0 && addButton}
      </div>
      {links.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No dishes in this category yet"
          description="Add dishes to group them under this category."
          action={addButton}
        />
      ) : (
        <Table framed>
          <TableHeader>
            <TableRow>
              <TableHead>Dish</TableHead>
              <ActionsHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id}>
                <TableCell className="font-medium">
                  <Link href={`/recipes/${link.recipe_id}`} className="hover:underline">
                    {nameOf(link.recipe_id)}
                  </Link>
                </TableCell>
                <TableCell className="w-12 px-2 py-1">
                  <RowActionsMenu label={`Actions for ${nameOf(link.recipe_id)}`}>
                    <MenuItem href={`/recipes/${link.recipe_id}`} icon={ExternalLink}>
                      Open dish
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem danger icon={Trash2} onSelect={() => setConfirming(link)}>
                      Remove from category
                    </MenuItem>
                  </RowActionsMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <RecipePickerPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Add dish"
        description={categoryName}
        recipeOptions={recipeOptions}
        submitLabel="Add dish"
        pending={addRecipe.isPending}
        onSubmit={handleAdd}
      />
      <ConfirmModal
        isOpen={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={handleRemove}
        title="Remove dish from category"
        message={confirming ? `${nameOf(confirming.recipe_id)} leaves ${categoryName}. The dish itself is kept.` : ''}
        confirmLabel="Remove dish"
        variant="destructive"
        pending={removeRecipe.isPending}
      />
    </section>
  );
}
