'use client';

/** A supplier in the /suppliers grid: name (with its code apart), contact lines and a row menu. */
import { useState } from 'react';
import Link from 'next/link';
import { Archive, ArchiveRestore, ExternalLink, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useDeactivateSupplier, useUpdateSupplier } from '@/lib/hooks';
import { Badge, Card, ConfirmModal, EntityCode, MenuItem } from '@/components/ui';
import { supplierDisplayName } from '@/lib/format/displayName';
import type { Supplier } from '@/types';
import { RowActionsMenu } from './RowActionsMenu';

function ContactLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <p className="flex min-w-0 items-center gap-2">
      <Icon className="size-4 shrink-0 text-tertiary" strokeWidth={1.5} aria-hidden="true" />
      <span className="truncate" title={text}>
        {text}
      </span>
    </p>
  );
}

export function SupplierCard({ supplier }: { supplier: Supplier }) {
  const [confirmArchive, setConfirmArchive] = useState(false);
  const updateSupplier = useUpdateSupplier();
  const deactivateSupplier = useDeactivateSupplier();
  const { code, name } = supplierDisplayName(supplier);
  const href = `/suppliers/${supplier.id}`;
  const hasContact = Boolean(supplier.address || supplier.phone_number || supplier.email);

  const handleArchive = () => {
    deactivateSupplier.mutate(supplier.id, {
      onSuccess: () => toast.success(`${name} archived`),
      onError: () => toast.error(`Failed to archive ${name}`),
      onSettled: () => setConfirmArchive(false),
    });
  };

  const handleRestore = () => {
    updateSupplier.mutate(
      { id: supplier.id, data: { is_active: true } },
      {
        onSuccess: () => toast.success(`${name} restored`),
        onError: () => toast.error(`Failed to restore ${name}`),
      }
    );
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <Link href={href} className="min-w-0 flex-1 hover:underline">
          {code && <EntityCode className="mb-1">{code}</EntityCode>}
          <span className="block font-medium break-words text-ink">{name}</span>
        </Link>
        <div className="-mt-1.5 -mr-2">
          <RowActionsMenu label={`Actions for ${name}`}>
            <MenuItem href={href} icon={ExternalLink}>
              Open supplier
            </MenuItem>
            {supplier.is_active ? (
              <MenuItem danger icon={Archive} onSelect={() => setConfirmArchive(true)}>
                Archive
              </MenuItem>
            ) : (
              <MenuItem icon={ArchiveRestore} onSelect={handleRestore} disabled={updateSupplier.isPending}>
                Restore
              </MenuItem>
            )}
          </RowActionsMenu>
        </div>
      </div>
      {!supplier.is_active && <Badge variant="warning" className="self-start">Archived</Badge>}
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {supplier.address && <ContactLine icon={MapPin} text={supplier.address} />}
        {supplier.phone_number && <ContactLine icon={Phone} text={supplier.phone_number} />}
        {supplier.email && <ContactLine icon={Mail} text={supplier.email} />}
        {!hasContact && <p className="text-tertiary">No contact details</p>}
      </div>
      <ConfirmModal
        isOpen={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={handleArchive}
        title={`Archive ${name}?`}
        message="It leaves the supplier list and pickers. Its ingredient links and history are kept, and you can restore it from the archived view."
        confirmLabel="Archive supplier"
        variant="destructive"
        pending={deactivateSupplier.isPending}
      />
    </Card>
  );
}
