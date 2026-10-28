'use client';

import { useState } from 'react';
import { Edit2, Archive, ArchiveRestore } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
import type { Category } from '@/types';
import { formatDisplayName } from '@/lib/format/displayName';

interface CategoryListRowProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onArchive?: (category: Category) => void;
  onUnarchive?: (category: Category) => void;
}

export function CategoryListRow({
  category,
  onEdit,
  onArchive,
  onUnarchive,
}: CategoryListRowProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card
      className="relative py-4"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="mt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-ink break-words">
              {formatDisplayName(category.name)}
            </h3>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(category);
                  }}
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onArchive && category.is_active && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.preventDefault();
                    onArchive(category);
                  }}
                  title="Archive"
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              )}
              {onUnarchive && !category.is_active && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.preventDefault();
                    onUnarchive(category);
                  }}
                  title="Unarchive"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
