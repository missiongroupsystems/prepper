'use client';

import { Store } from 'lucide-react';
import { Badge, EntityCode } from '@/components/ui';
import { RecordCard } from '@/components/lists/RecordCard';
import { RowActions } from '@/components/lists/RowActions';
import type { Outlet } from '@/types';

interface OutletCardProps {
  outlet: Outlet;
  parentOutletName?: string;
  onArchive?: (outlet: Outlet) => void;
  onUnarchive?: (outlet: Outlet) => void;
}

export function OutletCard({ outlet, parentOutletName, onArchive, onUnarchive }: OutletCardProps) {
  const href = `/outlets/${outlet.id}`;
  return (
    <RecordCard
      title={outlet.name}
      eyebrow={outlet.code ? <EntityCode>{outlet.code}</EntityCode> : undefined}
      subtitle={parentOutletName ? `Under ${parentOutletName}` : undefined}
      icon={Store}
      href={href}
      badges={
        <>
          <Badge>{outlet.outlet_type === 'brand' ? 'Brand' : 'Location'}</Badge>
          {!outlet.is_active && <Badge variant="warning">Archived</Badge>}
        </>
      }
      actions={
        <RowActions
          item={outlet}
          name={outlet.name}
          isActive={outlet.is_active}
          editHref={href}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
        />
      }
    />
  );
}
