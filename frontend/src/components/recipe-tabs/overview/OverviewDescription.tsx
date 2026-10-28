'use client';

/** The recipe description: a labelled textarea that autosaves after a pause in typing, and on blur. */
import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUpdateRecipe } from '@/lib/hooks';
import { Label, Textarea } from '@/components/ui';
import type { Recipe } from '@/types';
import { OverviewSection } from './OverviewSection';

const AUTOSAVE_DELAY_MS = 800;
const DESCRIPTION_ROWS = 4;

export function OverviewDescription({ recipe, canEdit }: { recipe: Recipe; canEdit: boolean }) {
  const { mutate: updateRecipe } = useUpdateRecipe();
  const [value, setValue] = useState(recipe.description ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fieldId = useId();

  const save = (next: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (next === (recipe.description ?? '')) return;
    updateRecipe(
      { id: recipe.id, data: { description: next } },
      { onError: () => toast.error('Could not save the description') }
    );
  };

  // A pending save is dropped, not flushed, when the component goes — blur already flushed it.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (!canEdit) {
    return (
      <OverviewSection title="Description">
        <p className={recipe.description ? 'whitespace-pre-wrap text-sm text-ink' : 'text-sm text-tertiary'}>
          {recipe.description || 'No description yet'}
        </p>
      </OverviewSection>
    );
  }

  return (
    <OverviewSection title="Description">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={fieldId} className="sr-only">
          Description
        </Label>
        <Textarea
          id={fieldId}
          value={value}
          rows={DESCRIPTION_ROWS}
          placeholder="What is this dish, and what makes it work?"
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => save(next), AUTOSAVE_DELAY_MS);
          }}
          onBlur={() => save(value)}
        />
      </div>
    </OverviewSection>
  );
}
