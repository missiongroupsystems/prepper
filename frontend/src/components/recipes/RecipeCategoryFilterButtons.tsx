'use client';

import { useState } from 'react';
import { FilterGroup, FilterPill } from '@/components/lists/FilterPills';
import { formatDisplayName } from '@/lib/format/displayName';
import type { RecipeCategory } from '@/types';

const CATEGORY_VISIBLE_LIMIT = 8;

interface RecipeCategoryFilterButtonsProps {
  categories: RecipeCategory[] | undefined;
  selectedCategories: number[];
  onCategoryChange: (categoryIds: number[]) => void;
}

export function RecipeCategoryFilterButtons({
  categories,
  selectedCategories,
  onCategoryChange,
}: RecipeCategoryFilterButtonsProps) {
  const [showAll, setShowAll] = useState(false);

  if (!categories || categories.length === 0) return null;

  const toggleCategory = (categoryId: number) => {
    onCategoryChange(
      selectedCategories.includes(categoryId)
        ? selectedCategories.filter((id) => id !== categoryId)
        : [...selectedCategories, categoryId]
    );
  };

  const visible = showAll ? categories : categories.slice(0, CATEGORY_VISIBLE_LIMIT);
  const hiddenCount = categories.length - CATEGORY_VISIBLE_LIMIT;

  return (
    <FilterGroup label="Category">
      {visible.map((category) => (
        <FilterPill
          key={category.id}
          pressed={selectedCategories.includes(category.id)}
          onClick={() => toggleCategory(category.id)}
        >
          {formatDisplayName(category.name)}
        </FilterPill>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          aria-expanded={showAll}
          className="rounded-full px-2 py-1 text-[13px] text-muted-foreground underline underline-offset-2 hover:text-ink max-sm:min-h-10"
        >
          {showAll ? 'Show fewer' : `${hiddenCount} more`}
        </button>
      )}
    </FilterGroup>
  );
}
