'use client';

import { Badge } from '@/components/ui';
import { RecordCard } from '@/components/lists/RecordCard';
import { RowActions } from '@/components/lists/RowActions';
import type { Allergen } from '@/types';

interface AllergenCardProps {
  allergen: Allergen;
  onEdit?: (allergen: Allergen) => void;
  onArchive?: (allergen: Allergen) => void;
  onUnarchive?: (allergen: Allergen) => void;
}

export function AllergenCard({ allergen, onEdit, onArchive, onUnarchive }: AllergenCardProps) {
  const title = allergen.name;
  return (
    <RecordCard
      title={title}
      description={allergen.description}
      badges={!allergen.is_active ? <Badge variant="warning">Archived</Badge> : undefined}
      actions={
        <RowActions
          item={allergen}
          name={title}
          isActive={allergen.is_active}
          onEdit={onEdit}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
        />
      }
    />
  );
}
