'use client';

import { useRouter } from 'next/navigation';
import { Edit2, Archive, ArchiveRestore } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { RecipeCategory } from '@/types';

interface RecipeCategoryListRowProps {
  category: RecipeCategory;
  onArchive?: (category: RecipeCategory) => void;
  onUnarchive?: (category: RecipeCategory) => void;
}

export function RecipeCategoryListRow({ category, onArchive, onUnarchive }: RecipeCategoryListRowProps) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground truncate">
            {category.name}
          </h3>
          {!category.is_active && (
            <Badge variant="warning">Archived</Badge>
          )}
        </div>
        {category.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
            {category.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Created {new Date(category.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-1 ml-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push(`/recipe-categories/${category.id}`)}
          title="View Details"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        {onArchive && category.is_active && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onArchive(category)}
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </Button>
        )}
        {onUnarchive && !category.is_active && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUnarchive(category)}
            title="Unarchive"
          >
            <ArchiveRestore className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
