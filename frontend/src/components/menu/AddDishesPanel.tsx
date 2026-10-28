'use client';

/** Pick several dishes at once for a section; they're added (and autosaved) on confirm. */
import { useState } from 'react';
import { Button, SidePanel } from '@/components/ui';
import type { PickedRecipe } from './draftOps';
import type { DraftSection } from './menuDraft';
import { RecipeSearchList } from './RecipeSearchList';

export function AddDishesPanel({
  section,
  onAdd,
  onClose,
}: {
  section: DraftSection;
  onAdd: (recipes: PickedRecipe[]) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<Map<number, PickedRecipe>>(new Map());
  const onSection = new Set(section.items.map((i) => i.recipe_id));

  const toggle = (recipe: PickedRecipe) =>
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(recipe.id)) next.delete(recipe.id);
      else next.set(recipe.id, recipe);
      return next;
    });

  const count = picked.size;

  return (
    <SidePanel
      open
      onClose={onClose}
      title="Add dishes"
      description={`To ${section.name || 'this section'}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={count === 0} onClick={() => onAdd([...picked.values()])}>
            {count === 0 ? 'Add dishes' : `Add ${count} ${count === 1 ? 'dish' : 'dishes'}`}
          </Button>
        </>
      }
    >
      <RecipeSearchList
        label="Search dishes to add"
        selectedIds={new Set(picked.keys())}
        unavailableIds={onSection}
        onPick={toggle}
      />
    </SidePanel>
  );
}
