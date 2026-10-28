'use client';

import { useState } from 'react';
import { Tag } from 'lucide-react';
import { useTagsForSupplierIngredient } from '@/lib/hooks';
import { Badge } from '@/components/ui';
import { TagManagementModal } from './TagManagementModal';
import { formatDisplayName } from '@/lib/format/displayName';

interface TagsCellProps {
  siId: number;
}

export function TagsCell({ siId }: TagsCellProps) {
  const [open, setOpen] = useState(false);
  const { data: tags = [] } = useTagsForSupplierIngredient(siId);

  return (
    <>
      <div className="flex items-center gap-1 flex-wrap">
        {tags.map((tag) => (
          <Badge key={tag.id}>{formatDisplayName(tag.name)}</Badge>
        ))}
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-lg p-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Edit tags"
        >
          <Tag className="h-3.5 w-3.5" />
        </button>
      </div>

      <TagManagementModal
        siId={siId}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
