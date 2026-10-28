'use client';

/** ViewToggle — grid or list, as an icon-only SegmentedControl. */
import { LayoutGrid, List } from 'lucide-react';
import { SegmentedControl, type SegmentedItem } from './SegmentedControl';

type ViewType = 'grid' | 'list';

const VIEWS: SegmentedItem[] = [
  { id: 'grid', label: 'Grid view', icon: LayoutGrid, iconOnly: true },
  { id: 'list', label: 'List view', icon: List, iconOnly: true },
];

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <SegmentedControl
      items={VIEWS}
      activeId={view}
      label="View"
      onSelect={(id) => onViewChange(id as ViewType)}
    />
  );
}
