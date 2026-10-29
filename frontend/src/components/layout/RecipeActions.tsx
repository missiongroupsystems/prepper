'use client';

/**
 * The dish page's actions kebab: delete (a soft delete — the dish is archived) or, for an archived
 * dish, restore it to draft. Only the owner or an admin sees it.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppState } from '@/lib/store';
import { canEditRecipe } from '@/lib/permissions/recipe';
import { useDeleteRecipe, useRecipe, useUpdateRecipeStatus } from '@/lib/hooks';
import { ConfirmModal, MenuItem } from '@/components/ui';
import { RowActionsMenu } from '@/components/catalogue';

const DISHES_HREF = '/recipes';

export function RecipeActions() {
  const router = useRouter();
  const { selectedRecipeId, selectRecipe, userId, userType } = useAppState();
  const { data: recipe } = useRecipe(selectedRecipeId);
  const deleteRecipe = useDeleteRecipe();
  const updateStatus = useUpdateRecipeStatus();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!recipe || !canEditRecipe(recipe, userId, userType)) return null;

  const isArchived = recipe.status === 'archived';

  const handleDelete = () => {
    deleteRecipe.mutate(recipe.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        selectRecipe(null);
        toast.success(`${recipe.name} deleted`);
        router.push(DISHES_HREF);
      },
      onError: () => toast.error(`Failed to delete ${recipe.name}`),
    });
  };

  const handleRestore = () => {
    updateStatus.mutate(
      { id: recipe.id, status: 'draft' },
      {
        onSuccess: () => toast.success(`${recipe.name} restored as a draft`),
        onError: () => toast.error(`Failed to restore ${recipe.name}`),
      }
    );
  };

  return (
    <>
      <RowActionsMenu label="Dish actions">
        {isArchived ? (
          <MenuItem icon={ArchiveRestore} onSelect={handleRestore}>
            Restore dish
          </MenuItem>
        ) : (
          <MenuItem icon={Trash2} danger onSelect={() => setConfirmOpen(true)}>
            Delete dish
          </MenuItem>
        )}
      </RowActionsMenu>
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${recipe.name}?`}
        message="It leaves the dish list and pickers. Menus, menu sketches and tasting sessions that already use it keep showing it — remove it there if it should go. You can restore it from the Archived filter."
        confirmLabel="Delete dish"
        variant="destructive"
        pending={deleteRecipe.isPending}
      />
    </>
  );
}
