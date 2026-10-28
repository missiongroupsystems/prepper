'use client';

/** Add allergen — a SidePanel; the name is kept from the modal it replaced. */
import { useCreateAllergen } from '@/lib/hooks';
import { NameDescriptionCreatePanel } from '@/components/forms/NameDescriptionPanels';

export const ALLERGEN_COPY = {
  noun: 'allergen',
  namePlaceholder: 'e.g. Milk, peanuts, fish',
  descriptionPlaceholder: 'Anything a cook should know about it',
};

interface AddAllergenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAllergenModal({ isOpen, onClose }: AddAllergenModalProps) {
  const createAllergen = useCreateAllergen();
  return (
    <NameDescriptionCreatePanel open={isOpen} onClose={onClose} copy={ALLERGEN_COPY} create={createAllergen.mutateAsync} />
  );
}
