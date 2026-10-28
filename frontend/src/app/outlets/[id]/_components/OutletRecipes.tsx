'use client';

/**
 * The dishes sold at an outlet, each with an optional price override that autosaves in place,
 * then the dishes it inherits from its parent brand (read-only).
 */
import { useState } from 'react';
import Link from 'next/link';
import { CookingPot, Eraser, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAddRecipeToOutlet, useRemoveRecipeFromOutlet, useUpdateRecipeOutlet } from '@/lib/hooks';
import {
  Button,
  ConfirmModal,
  EditableCell,
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
import { formatCurrency } from '@/lib/utils';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Recipe, RecipeOutlet } from '@/types';

interface OutletRecipesProps {
  outletId: number;
  outletName: string;
  outletRecipes: RecipeOutlet[];
  parentRecipes: RecipeOutlet[];
  recipes: Recipe[];
}

export function OutletRecipes({ outletId, outletName, outletRecipes, parentRecipes, recipes }: OutletRecipesProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [confirming, setConfirming] = useState<RecipeOutlet | null>(null);
  const addRecipe = useAddRecipeToOutlet();
  const updateRecipe = useUpdateRecipeOutlet();
  const removeRecipe = useRemoveRecipeFromOutlet();

  const nameOf = (recipeId: number) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    return recipe ? formatDisplayName(recipe.name) : 'Unknown dish';
  };
  const addedIds = new Set(outletRecipes.map((r) => r.recipe_id));
  const recipeOptions = recipes
    .filter((r) => !addedIds.has(r.id))
    .map((r) => ({ value: String(r.id), label: formatDisplayName(r.name) }));

  const savePrice = (recipeId: number, priceOverride: number | null) => {
    updateRecipe.mutate(
      { recipeId, outletId, data: { price_override: priceOverride } },
      { onError: () => toast.error('Failed to save the price override') }
    );
  };

  const handlePriceInput = (recipeId: number) => (value: string) => {
    if (!value.trim()) return savePrice(recipeId, null);
    const n = parseFloat(value);
    if (!Number.isFinite(n) || n < 0) {
      toast.error('Price override must be a number of 0 or more');
      return;
    }
    savePrice(recipeId, n);
  };

  const handleAdd = async ({ recipeId, priceOverride }: RecipePickerValues) => {
    try {
      await addRecipe.mutateAsync({ recipeId, data: { outlet_id: outletId, price_override: priceOverride } });
      toast.success(`${nameOf(recipeId)} added to ${outletName}`);
      return true;
    } catch {
      toast.error('Failed to add the dish');
      return false;
    }
  };

  const handleRemove = () => {
    if (!confirming) return;
    removeRecipe.mutate(
      { recipeId: confirming.recipe_id, outletId },
      {
        onSuccess: () => toast.success(`${nameOf(confirming.recipe_id)} removed from ${outletName}`),
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
    <>
      <section className="flex flex-col gap-3" aria-labelledby="outlet-recipes">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="outlet-recipes" className="text-lg">
            Dishes
          </h2>
          {outletRecipes.length > 0 && addButton}
        </div>
        {outletRecipes.length === 0 ? (
          <EmptyState
            icon={CookingPot}
            title="No dishes at this outlet yet"
            description="Add the dishes this outlet sells. Each can carry its own price."
            action={addButton}
          />
        ) : (
          <Table framed>
            <TableHeader>
              <TableRow>
                <TableHead>Dish</TableHead>
                <TableHead numeric>Price override</TableHead>
                <ActionsHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {outletRecipes.map((row) => (
                <TableRow key={row.recipe_id}>
                  <TableCell className="font-medium">
                    <Link href={`/recipes/${row.recipe_id}`} className="hover:underline">
                      {nameOf(row.recipe_id)}
                    </Link>
                  </TableCell>
                  <TableCell numeric>
                    <EditableCell
                      type="number"
                      value={row.price_override?.toString() ?? ''}
                      displayValue={row.price_override !== null ? formatCurrency(row.price_override) : ''}
                      placeholder="Dish price"
                      onSave={handlePriceInput(row.recipe_id)}
                      className="inline-block w-28 text-right"
                    />
                  </TableCell>
                  <TableCell className="w-12 px-2 py-1">
                    <RowActionsMenu label={`Actions for ${nameOf(row.recipe_id)}`}>
                      <MenuItem href={`/recipes/${row.recipe_id}`} icon={ExternalLink}>
                        Open dish
                      </MenuItem>
                      {row.price_override !== null && (
                        <MenuItem icon={Eraser} onSelect={() => savePrice(row.recipe_id, null)}>
                          Clear price override
                        </MenuItem>
                      )}
                      <MenuSeparator />
                      <MenuItem danger icon={Trash2} onSelect={() => setConfirming(row)}>
                        Remove from outlet
                      </MenuItem>
                    </RowActionsMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {parentRecipes.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="parent-recipes">
          <div className="flex flex-col gap-1">
            <h2 id="parent-recipes" className="text-lg">
              From the parent brand
            </h2>
            <p className="text-sm text-muted-foreground">Inherited dishes. Change them on the brand.</p>
          </div>
          <Table framed>
            <TableHeader>
              <TableRow>
                <TableHead>Dish</TableHead>
                <TableHead numeric>Price override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parentRecipes.map((row) => (
                <TableRow key={row.recipe_id}>
                  <TableCell>
                    <Link href={`/recipes/${row.recipe_id}`} className="text-muted-foreground hover:underline">
                      {nameOf(row.recipe_id)}
                    </Link>
                  </TableCell>
                  <TableCell numeric className="text-muted-foreground">
                    {formatCurrency(row.price_override)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      <RecipePickerPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Add dish"
        description={outletName}
        recipeOptions={recipeOptions}
        withPriceOverride
        submitLabel="Add dish"
        pending={addRecipe.isPending}
        onSubmit={handleAdd}
      />
      <ConfirmModal
        isOpen={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={handleRemove}
        title="Remove dish from outlet"
        message={confirming ? `${nameOf(confirming.recipe_id)} will no longer be sold at ${outletName}. The dish itself is kept.` : ''}
        confirmLabel="Remove dish"
        variant="destructive"
        pending={removeRecipe.isPending}
      />
    </>
  );
}
