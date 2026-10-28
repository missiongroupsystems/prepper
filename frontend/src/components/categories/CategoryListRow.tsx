'use client';

import { Badge } from '@/components/ui';
import { RecordRow } from '@/components/lists/RecordCard';
import { RowActions } from '@/components/lists/RowActions';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Category } from '@/types';

interface CategoryListRowProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onArchive?: (category: Category) => void;
  onUnarchive?: (category: Category) => void;
}

export function CategoryListRow({ category, onEdit, onArchive, onUnarchive }: CategoryListRowProps) {
  const title = formatDisplayName(category.name);
  return (
    <RecordRow
      title={title}
      description={category.description}
      badges={!category.is_active ? <Badge variant="warning">Archived</Badge> : undefined}
      actions={
        <RowActions
          item={category}
          name={title}
          isActive={category.is_active}
          onEdit={onEdit}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
        />
      }
    />
  );
}
