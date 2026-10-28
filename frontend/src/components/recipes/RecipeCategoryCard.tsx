'use client';

import { Badge } from '@/components/ui';
import { RecordCard } from '@/components/lists/RecordCard';
import { RowActions } from '@/components/lists/RowActions';
import { formatDisplayName } from '@/lib/format/displayName';
import type { RecipeCategory } from '@/types';

interface RecipeCategoryCardProps {
  category: RecipeCategory;
  onArchive?: (category: RecipeCategory) => void;
  onUnarchive?: (category: RecipeCategory) => void;
}

export function RecipeCategoryCard({ category, onArchive, onUnarchive }: RecipeCategoryCardProps) {
  const title = formatDisplayName(category.name);
  const href = `/recipe-categories/${category.id}`;
  return (
    <RecordCard
      title={title}
      description={category.description}
      href={href}
      badges={!category.is_active ? <Badge variant="warning">Archived</Badge> : undefined}
      actions={
        <RowActions
          item={category}
          name={title}
          isActive={category.is_active}
          editHref={href}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
        />
      }
    />
  );
}
