'use client';

/** Ingredients → Allergens: the allergen list, added in a panel and edited with autosave. */
import { useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAllergens, useUpdateAllergen, useDeleteAllergen } from '@/lib/hooks';
import { AddAllergenModal, ALLERGEN_COPY } from '@/components/allergens/AddAllergenModal';
import { AllergenCard } from '@/components/allergens/AllergenCard';
import { AllergenListRow } from '@/components/allergens/AllergenListRow';
import { NameDescriptionEditPanel } from '@/components/forms/NameDescriptionPanels';
import { ReferenceListView, type ListView } from '@/components/lists/ReferenceListView';
import type { Allergen } from '@/types';

export function AllergensTab() {
  const deactivateAllergen = useDeleteAllergen();
  const updateAllergen = useUpdateAllergen();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [view, setView] = useState<ListView>('grid');
  const { data: allergens, isLoading, error } = useAllergens(showArchived);

  const filteredAllergens = useMemo(() => {
    const needle = search.toLowerCase();
    return (allergens ?? []).filter((allergen) => !needle || allergen.name.toLowerCase().includes(needle));
  }, [allergens, search]);
  const editing = allergens?.find((a) => a.id === editingId) ?? null;

  const handleArchive = (allergen: Allergen) => {
    deactivateAllergen.mutate(allergen.id, {
      onSuccess: () => toast.success(`${allergen.name} archived`),
      onError: () => toast.error(`Failed to archive ${allergen.name}`),
    });
  };

  const handleUnarchive = (allergen: Allergen) => {
    updateAllergen.mutate(
      { id: allergen.id, data: { is_active: true } },
      {
        onSuccess: () => toast.success(`${allergen.name} unarchived`),
        onError: () => toast.error(`Failed to unarchive ${allergen.name}`),
      }
    );
  };

  const edit = (allergen: Allergen) => setEditingId(allergen.id);

  return (
    <ReferenceListView
      title="Allergens"
      description="The allergens ingredients can carry, shown on dishes and menus."
      noun="allergens"
      icon={ShieldAlert}
      onAdd={() => setShowForm(true)}
      addLabel="Add allergen"
      search={search}
      onSearchChange={setSearch}
      showArchived={showArchived}
      onShowArchivedChange={setShowArchived}
      view={view}
      onViewChange={setView}
      items={filteredAllergens}
      isLoading={isLoading}
      error={error}
      renderItem={(allergen, itemView) => {
        const Item = itemView === 'grid' ? AllergenCard : AllergenListRow;
        return (
          <Item key={allergen.id} allergen={allergen} onEdit={edit} onArchive={handleArchive} onUnarchive={handleUnarchive} />
        );
      }}
    >
      <AddAllergenModal isOpen={showForm} onClose={() => setShowForm(false)} />
      <NameDescriptionEditPanel
        record={editing}
        onClose={() => setEditingId(null)}
        copy={ALLERGEN_COPY}
        update={(patch) => updateAllergen.mutateAsync({ id: editingId as number, data: patch })}
      />
    </ReferenceListView>
  );
}
