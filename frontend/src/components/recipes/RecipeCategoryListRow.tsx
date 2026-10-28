'use client';

import { Badge } from '@/components/ui';
import { RecordRow } from '@/components/lists/RecordCard';
import { RowActions } from '@/components/lists/RowActions';
import { formatDisplayName } from '@/lib/format/displayName';
import type { RecipeCategory } from '@/types';

interface RecipeCategoryListRowProps {
  category: RecipeCategory;
  onArchive?: (category: RecipeCategory) => void;
  onUnarchive?: (category: RecipeCategory) => void;
}

export function RecipeCategoryListRow({ category, onArchive, onUnarchive }: RecipeCategoryListRowProps) {
  const title = formatDisplayName(category.name);
  const href = `/recipe-categories/${category.id}`;
  return (
    <RecordRow
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
