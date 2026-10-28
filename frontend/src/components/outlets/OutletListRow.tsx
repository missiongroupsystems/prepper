'use client';

import { Badge, EntityCode } from '@/components/ui';
import { RecordRow } from '@/components/lists/RecordCard';
import type { Outlet } from '@/types';

interface OutletListRowProps {
  outlet: Outlet;
  parentOutletName?: string;
  href?: string;
}

export function OutletListRow({ outlet, parentOutletName, href }: OutletListRowProps) {
  return (
    <RecordRow
      title={outlet.name}
      eyebrow={outlet.code ? <EntityCode>{outlet.code}</EntityCode> : undefined}
      subtitle={parentOutletName ? `Under ${parentOutletName}` : undefined}
      href={href ?? `/outlets/${outlet.id}`}
      badges={
        <>
          <Badge>{outlet.outlet_type === 'brand' ? 'Brand' : 'Location'}</Badge>
          {!outlet.is_active && <Badge variant="warning">Archived</Badge>}
        </>
      }
    />
  );
}
