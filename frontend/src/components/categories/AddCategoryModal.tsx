'use client';

/** Add ingredient tag — a SidePanel; the name is kept from the modal it replaced. */
import { useCreateCategory } from '@/lib/hooks';
import { NameDescriptionCreatePanel } from '@/components/forms/NameDescriptionPanels';

export const TAG_COPY = {
  noun: 'tag',
  namePlaceholder: 'e.g. Proteins, dry goods',
  descriptionPlaceholder: 'What belongs under this tag',
};

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCategoryModal({ isOpen, onClose }: AddCategoryModalProps) {
  const createCategory = useCreateCategory();
  return (
    <NameDescriptionCreatePanel open={isOpen} onClose={onClose} copy={TAG_COPY} create={createCategory.mutateAsync} />
  );
}
