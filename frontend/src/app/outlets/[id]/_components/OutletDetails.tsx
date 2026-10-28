'use client';

import { Card, EditableCell, Select } from '@/components/ui';
import { DetailField, DetailList, RecordTimestamps, inlineEditClasses } from '@/components/catalogue';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Outlet, OutletType, UpdateOutletRequest } from '@/types';

const OUTLET_TYPE_OPTIONS: { value: OutletType; label: string }[] = [
  { value: 'brand', label: 'Brand' },
  { value: 'location', label: 'Location' },
];
const NO_PARENT = '';

interface OutletDetailsProps {
  outlet: Outlet;
  allOutlets: Outlet[];
  onUpdate: (data: UpdateOutletRequest) => void;
}

export function OutletDetails({ outlet, allOutlets, onUpdate }: OutletDetailsProps) {
  const hasChildren = allOutlets.some((o) => o.parent_outlet_id === outlet.id);
  // A brand with children, or a location under a brand, would leave the hierarchy inconsistent.
  const typeLocked = hasChildren || (outlet.outlet_type === 'location' && outlet.parent_outlet_id !== null);
  const typeHint = hasChildren ? 'Locked while it has child outlets' : typeLocked ? 'Locked while it has a parent' : undefined;

  const parentOptions = allOutlets
    .filter((o) => o.id !== outlet.id && o.outlet_type === 'brand' && (o.is_active || o.id === outlet.parent_outlet_id))
    .map((o) => ({ value: String(o.id), label: formatDisplayName(o.name) }));

  return (
    <Card className="flex flex-col gap-5">
      <DetailList>
        <DetailField label="Name">
          <EditableCell
            value={outlet.name}
            displayValue={formatDisplayName(outlet.name)}
            onSave={(value) => value.trim() && onUpdate({ name: value.trim() })}
            className={inlineEditClasses}
          />
        </DetailField>
        <DetailField label="Code">
          <EditableCell
            value={outlet.code}
            onSave={(value) => value.trim() && onUpdate({ code: value.trim() })}
            className={inlineEditClasses}
          />
        </DetailField>
        <DetailField label="Outlet type" hint={typeHint}>
          <Select
            aria-label="Outlet type"
            value={outlet.outlet_type}
            options={OUTLET_TYPE_OPTIONS}
            disabled={typeLocked}
            onChange={(e) => onUpdate({ outlet_type: e.target.value as OutletType })}
            className="w-48"
          />
        </DetailField>
        <DetailField label="Parent outlet">
          {outlet.outlet_type === 'brand' ? (
            <span className="text-tertiary">Brands sit at the top; only locations have a parent.</span>
          ) : (
            <Select
              aria-label="Parent outlet"
              value={outlet.parent_outlet_id !== null ? String(outlet.parent_outlet_id) : NO_PARENT}
              options={[{ value: NO_PARENT, label: 'None' }, ...parentOptions]}
              onChange={(e) =>
                onUpdate({ parent_outlet_id: e.target.value === NO_PARENT ? null : parseInt(e.target.value, 10) })
              }
              className="w-full sm:w-64"
            />
          )}
        </DetailField>
      </DetailList>
      <RecordTimestamps createdAt={outlet.created_at} updatedAt={outlet.updated_at} />
    </Card>
  );
}
