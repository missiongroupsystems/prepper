'use client';

/** One supplier as a grid card or a list row: code, name, contact line, archive menu. */
import { Badge, EntityCode } from '@/components/ui';
import { RecordCard, RecordRow } from '@/components/lists/RecordCard';
import { RowActions } from '@/components/lists/RowActions';
import { formatDisplayName, supplierDisplayName } from '@/lib/format/displayName';
import type { Supplier } from '@/types';

interface SupplierItemProps {
  supplier: Supplier;
  href?: string;
  onArchive?: (supplier: Supplier) => void;
  onUnarchive?: (supplier: Supplier) => void;
}

function supplierParts({ supplier, href, onArchive, onUnarchive }: SupplierItemProps) {
  const { code, name } = supplierDisplayName(supplier);
  const link = href ?? `/suppliers/${supplier.id}`;
  const contact = [supplier.phone_number, supplier.email].filter(Boolean).join(' · ');
  const shipping = supplier.shipping_company_name ? `Ships via ${formatDisplayName(supplier.shipping_company_name)}` : '';
  return {
    title: name,
    eyebrow: code ? <EntityCode>{code}</EntityCode> : undefined,
    subtitle: contact || shipping || 'No contact details',
    description: supplier.address,
    href: link,
    badges: !supplier.is_active ? <Badge variant="warning">Archived</Badge> : undefined,
    actions: (
      <RowActions
        item={supplier}
        name={name}
        isActive={supplier.is_active}
        editHref={link}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
      />
    ),
  };
}

export function SupplierCard(props: SupplierItemProps) {
  return <RecordCard {...supplierParts(props)} />;
}

export function SupplierListRow(props: SupplierItemProps) {
  return <RecordRow {...supplierParts(props)} />;
}
