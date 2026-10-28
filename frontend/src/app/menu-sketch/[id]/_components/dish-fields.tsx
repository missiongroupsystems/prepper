'use client';

import { useState } from 'react';
import { useDeleteMenuSketchSectionItem, useRecipeIngredients, useUpdateMenuSketchSectionItem } from '@/lib/hooks';
import type { MenuSketchSectionItem, Recipe, UpdateMenuSketchSectionItemRequest } from '@/types';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { costPercent, inlineFieldClasses, parsePrice, popoverClasses, popoverOptionClasses } from './shared';

const NAME_SUGGESTION_LIMIT = 5;

export type DishSave = (data: UpdateMenuSketchSectionItemRequest) => void;

/** State and mutations shared by the card and list renderings of a dish. */
export function useDish(item: MenuSketchSectionItem) {
  const updateItem = useUpdateMenuSketchSectionItem();
  const deleteItem = useDeleteMenuSketchSectionItem();
  const { data: recipeIngredients = [] } = useRecipeIngredients(item.recipe_id);
  const [showIcons, setShowIcons] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const save: DishSave = (data) => {
    updateItem.mutate({ id: item.id, data, prevRecipeId: item.recipe_id });
  };

  return {
    save,
    recipeIngredients,
    showIcons,
    toggleIcons: () => setShowIcons((v) => !v),
    confirmDelete,
    setConfirmDelete,
    showFeedback,
    setShowFeedback,
    deleteDish: () => {
      deleteItem.mutate(item.id);
      setConfirmDelete(false);
    },
  };
}

/** Dish name: searches and links existing recipes; a new name creates a recipe on blur. */
export function DishNameField({
  item,
  recipes,
  save,
  className,
}: {
  item: MenuSketchSectionItem;
  recipes: Recipe[];
  save: DishSave;
  className?: string;
}) {
  const [nameDraft, setNameDraft] = useState(item.recipe_name ?? '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = nameDraft.trim()
    ? recipes.filter(
        (r) =>
          r.name.toLowerCase().includes(nameDraft.toLowerCase()) &&
          r.name.toLowerCase() !== (item.recipe_name ?? '').toLowerCase()
      )
    : [];

  return (
    <div className="relative min-w-0 flex-1">
      <input
        type="text"
        aria-label="Dish name"
        value={nameDraft}
        onChange={(e) => {
          setNameDraft(e.target.value);
          setShowSuggestions(true);
        }}
        onBlur={() => {
          setShowSuggestions(false);
          if (nameDraft.trim() !== (item.recipe_name ?? '')) save({ name: nameDraft.trim() });
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setNameDraft(item.recipe_name ?? '');
            setShowSuggestions(false);
          }
        }}
        placeholder="Dish name"
        className={cn(inlineFieldClasses, 'h-8 text-base font-medium max-sm:h-11', className)}
      />
      {showSuggestions && filtered.length > 0 && (
        <div className={cn(popoverClasses, 'min-w-56')}>
          {filtered.slice(0, NAME_SUGGESTION_LIMIT).map((r) => (
            <button
              key={r.id}
              type="button"
              onMouseDown={() => {
                setNameDraft(r.name);
                setShowSuggestions(false);
                save({ name: r.name, recipe_id: r.id });
              }}
              className={popoverOptionClasses}
            >
              {r.name}
            </button>
          ))}
          {filtered.length > NAME_SUGGESTION_LIMIT && (
            <p className="px-3 py-1.5 text-xs text-tertiary">
              +{filtered.length - NAME_SUGGESTION_LIMIT} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** A money field that commits on blur: right-aligned tabular figures on the field look. */
export function PriceField({
  id,
  label,
  value,
  onCommit,
  className,
}: {
  id?: string;
  label: string;
  value: number | null;
  onCommit: (val: number | null) => void;
  className?: string;
}) {
  return (
    <Input
      id={id}
      aria-label={id ? undefined : label}
      inputMode="decimal"
      defaultValue={value ?? ''}
      onBlur={(e) => {
        const val = parsePrice(e.target);
        if (val !== value) onCommit(val);
      }}
      placeholder="0.00"
      className={cn('text-right tnum', className)}
    />
  );
}

/** Food cost %, computed — shown as a value, never as a field. */
export function CostPercent({ item, className }: { item: MenuSketchSectionItem; className?: string }) {
  const pct = costPercent(item);
  return (
    <span className={cn('tnum', pct == null ? 'text-tertiary' : 'text-ink', className)}>
      {pct != null ? `${pct}%` : '—'}
    </span>
  );
}
