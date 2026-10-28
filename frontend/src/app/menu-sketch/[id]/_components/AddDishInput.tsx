'use client';

import { useState } from 'react';
import { CornerDownLeft, Plus } from 'lucide-react';
import { useCreateMenuSketchSectionItem } from '@/lib/hooks';
import type { Recipe } from '@/types';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { popoverClasses, popoverOptionClasses, quietIconClasses } from './shared';

const DISH_SUGGESTION_LIMIT = 5;
const SUGGESTION_CLOSE_DELAY_MS = 150;

/** The last row of a section: type a new dish or pick an existing recipe. */
export function AddDishInput({
  sectionId,
  nextOrderNo,
  recipes,
}: {
  sectionId: number;
  nextOrderNo: number;
  recipes: Recipe[];
}) {
  const createItem = useCreateMenuSketchSectionItem();
  const [newDishName, setNewDishName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = newDishName.trim()
    ? recipes.filter((r) => r.name.toLowerCase().includes(newDishName.toLowerCase()))
    : [];

  const addDish = (name: string, recipeId?: number) => {
    if (!name.trim()) return;
    createItem.mutate({
      menu_sketch_section_id: sectionId,
      name: name.trim(),
      recipe_id: recipeId,
      order_no: nextOrderNo,
    });
    setNewDishName('');
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <Plus
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tertiary"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <Input
        aria-label="Add a dish"
        value={newDishName}
        onChange={(e) => {
          setNewDishName(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), SUGGESTION_CLOSE_DELAY_MS)}
        onKeyDown={(e) => { if (e.key === 'Enter') addDish(newDishName); }}
        placeholder="Type a dish name or search recipes"
        className="pr-11 pl-9"
      />
      <button
        type="button"
        onClick={() => addDish(newDishName)}
        disabled={!newDishName.trim()}
        aria-label="Add dish"
        title="Add dish"
        className={cn(quietIconClasses, 'absolute top-1/2 right-0.5 size-8 -translate-y-1/2 disabled:opacity-40 max-sm:size-10')}
      >
        <CornerDownLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
      {showSuggestions && suggestions.length > 0 && (
        <div className={popoverClasses}>
          <button type="button" onMouseDown={() => addDish(newDishName)} className={popoverOptionClasses}>
            <Plus className="size-3.5 text-tertiary" strokeWidth={1.5} aria-hidden="true" />
            Add as new dish: <span className="font-medium">&ldquo;{newDishName.trim()}&rdquo;</span>
          </button>
          {suggestions.slice(0, DISH_SUGGESTION_LIMIT).map((r) => (
            <button
              key={r.id}
              type="button"
              onMouseDown={() => addDish(r.name, r.id)}
              className={popoverOptionClasses}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
