'use client';

import { useId, useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import { Button, FieldHint, Label, SidePanel, Textarea } from '@/components/ui';
import { fuzzyMatchIngredient, parseIngredientsText } from '@/lib/utils';
import type { Ingredient } from '@/types';
import { newStagedIngredient } from './canvasModel';
import type { StagedIngredient } from './types';

type MatchableIngredient = { id: number; name: string; [key: string]: unknown };

const PASTE_ROWS = 10;

function match(text: string, ingredients: Ingredient[] | undefined): Ingredient | null {
  return fuzzyMatchIngredient(text, (ingredients || []) as unknown as MatchableIngredient[]) as Ingredient | null;
}

/**
 * Stages every line of a pasted list that matches a known ingredient: an ingredient already on
 * the canvas gains the line's quantity, a new one is added with it. Unmatched lines are reported.
 */
function stageParsedList({
  text,
  ingredients,
  stagedIngredients,
  setStagedIngredients,
  fetchSuppliersForIngredient,
}: {
  text: string;
  ingredients: Ingredient[] | undefined;
  stagedIngredients: StagedIngredient[];
  setStagedIngredients: Dispatch<SetStateAction<StagedIngredient[]>>;
  fetchSuppliersForIngredient: (ingredientId: number) => void;
}): boolean {
  if (!text.trim()) {
    toast.error('Please enter ingredients');
    return false;
  }
  const parsedLines = parseIngredientsText(text);
  if (parsedLines.length === 0) {
    toast.error('No valid ingredients found');
    return false;
  }

  const unmatched: string[] = [];
  const toAdd: StagedIngredient[] = [];
  for (const parsed of parsedLines) {
    const matched = match(parsed.ingredientText, ingredients);
    if (!matched) {
      unmatched.push(`${parsed.ingredientText}${parsed.quantity ? ` (${parsed.quantity}${parsed.unit})` : ''}`);
      continue;
    }
    const existingIndex = stagedIngredients.findIndex((s) => s.ingredient.id === matched.id);
    if (existingIndex >= 0) {
      setStagedIngredients((prev) =>
        prev.map((item, idx) => (idx === existingIndex ? { ...item, quantity: item.quantity + parsed.quantity } : item))
      );
    } else {
      toAdd.push(newStagedIngredient(matched, parsed.quantity));
      fetchSuppliersForIngredient(matched.id);
    }
  }
  if (toAdd.length > 0) setStagedIngredients((prev) => [...prev, ...toAdd]);

  const increased = parsedLines.filter((p) =>
    stagedIngredients.some((s) => s.ingredient.id === match(p.ingredientText, ingredients)?.id)
  ).length;
  const totalAdded = toAdd.length + increased;
  if (totalAdded > 0) toast.success(`Added ${totalAdded} ingredient${totalAdded !== 1 ? 's' : ''}`);
  if (unmatched.length > 0) {
    toast.warning(
      `${unmatched.length} ingredient${unmatched.length !== 1 ? 's' : ''} not found: ${unmatched.join(', ')}`
    );
  }
  return true;
}

/** Paste a list ("200g flour, 2 eggs") and stage every line that matches an ingredient. */
export function AddIngredientsPanel({
  open,
  onClose,
  ingredients,
  stagedIngredients,
  setStagedIngredients,
  fetchSuppliersForIngredient,
}: {
  open: boolean;
  onClose: () => void;
  ingredients: Ingredient[] | undefined;
  stagedIngredients: StagedIngredient[];
  setStagedIngredients: Dispatch<SetStateAction<StagedIngredient[]>>;
  fetchSuppliersForIngredient: (ingredientId: number) => void;
}) {
  const [text, setText] = useState('');
  const id = useId();

  const handleAdd = () => {
    const done = stageParsedList({ text, ingredients, stagedIngredients, setStagedIngredients, fetchSuppliersForIngredient });
    if (!done) return;
    setText('');
    onClose();
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Paste ingredient list"
      description="Each line that matches an ingredient is added to the canvas."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add ingredients</Button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-list`}>Ingredients</Label>
        <Textarea
          id={`${id}-list`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={PASTE_ROWS}
          placeholder={'200g plain flour\n2 eggs\n50ml double cream'}
          aria-describedby={`${id}-hint`}
        />
        <FieldHint id={`${id}-hint`}>One per line or comma-separated. Quantities and units are read from each line.</FieldHint>
      </div>
    </SidePanel>
  );
}
