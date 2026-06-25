'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
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

  const toggleCategory = (categoryId: number) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  const visible = showAll ? categories : categories.slice(0, CATEGORY_VISIBLE_LIMIT);
  const hasMore = categories.length > CATEGORY_VISIBLE_LIMIT;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs font-medium text-muted-foreground mr-1">
        Category:
      </span>
      {visible.map((category) => (
        <button
          key={category.id}
          onClick={() => toggleCategory(category.id)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full transition-colors',
            selectedCategories.includes(category.id)
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:bg-muted'
          )}
        >
          {category.name}
        </button>
      ))}
      {hasMore && (
        <button
          onClick={() => setShowAll((prev) => !prev)}
          className="px-3 py-1 text-xs font-medium rounded-full text-muted-foreground hover:text-foreground underline transition-colors"
        >
          {showAll ? 'See less' : `+${categories.length - CATEGORY_VISIBLE_LIMIT} more`}
        </button>
      )}
    </div>
  );
}
