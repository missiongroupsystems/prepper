'use client';

/** Add dish category — a SidePanel; the name is kept from the modal it replaced. */
import { useCreateRecipeCategory } from '@/lib/hooks';
import { NameDescriptionCreatePanel } from '@/components/forms/NameDescriptionPanels';

export const RECIPE_CATEGORY_COPY = {
  noun: 'category',
  namePlaceholder: 'e.g. Starters, mains, desserts',
  descriptionPlaceholder: 'e.g. Cold starters served before the main course',
};

interface AddRecipeCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddRecipeCategoryModal({ isOpen, onClose }: AddRecipeCategoryModalProps) {
  const createRecipeCategory = useCreateRecipeCategory();
  return (
    <NameDescriptionCreatePanel
      open={isOpen}
      onClose={onClose}
      copy={RECIPE_CATEGORY_COPY}
      create={createRecipeCategory.mutateAsync}
    />
  );
}
