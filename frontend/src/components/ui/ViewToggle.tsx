'use client';

import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewType = 'grid' | 'list';

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border p-1 bg-card">
      <button
        onClick={() => onViewChange('grid')}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          view === 'grid'
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Grid view"
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          view === 'list'
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="List view"
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
