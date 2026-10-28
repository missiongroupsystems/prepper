'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore } from 'lucide-react';
import { toast } from 'sonner';
import { useDeactivateSupplier, useSupplier, useUpdateSupplier } from '@/lib/hooks';
import { Page, SectionHeader } from '@/components/app';
import { Badge, Button, ConfirmModal, EntityCode } from '@/components/ui';
import { DetailLoadError, DetailSkeleton } from '@/components/catalogue';
import { supplierDisplayName } from '@/lib/format/displayName';
import type { UpdateSupplierRequest } from '@/types';
import { SupplierContact } from './_components/SupplierContact';
import { SupplierIngredients } from './_components/SupplierIngredients';

interface SupplierPageProps {
  params: Promise<{ id: string }>;
}

export default function SupplierPage({ params }: SupplierPageProps) {
  const { id } = use(params);
  const supplierId = parseInt(id, 10);
  const router = useRouter();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const { data: supplier, isLoading, error } = useSupplier(supplierId);
  const updateSupplier = useUpdateSupplier();
  const deactivateSupplier = useDeactivateSupplier();

  if (error) {
    return (
      <Page>
        <DetailLoadError title="Supplier not found" backHref="/ingredients" backLabel="Back to ingredients" />
      </Page>
    );
  }

  if (isLoading || !supplier) {
    return (
      <Page>
        <DetailSkeleton />
      </Page>
    );
  }

  const { code, name } = supplierDisplayName(supplier);

  const handleUpdate = (data: UpdateSupplierRequest) => {
    updateSupplier.mutate({ id: supplierId, data }, { onError: () => toast.error('Failed to save the change') });
  };

  const handleArchive = () => {
    deactivateSupplier.mutate(supplierId, {
      onSuccess: () => {
        toast.success(`${name} archived`);
        router.push('/ingredients');
      },
      onError: () => {
        toast.error(`Failed to archive ${name}`);
        setConfirmArchive(false);
      },
    });
  };

  const handleRestore = () => {
    updateSupplier.mutate(
      { id: supplierId, data: { is_active: true } },
      {
        onSuccess: () => toast.success(`${name} restored`),
        onError: () => toast.error(`Failed to restore ${name}`),
      }
    );
  };

  return (
    <Page>
      <SectionHeader
        eyebrow="Supplier"
        title={name}
        description={code ? <EntityCode>{code}</EntityCode> : undefined}
        actions={
          supplier.is_active ? (
            <Button variant="secondary" onClick={() => setConfirmArchive(true)}>
              <Archive className="size-4" strokeWidth={1.5} aria-hidden="true" />
              Archive
            </Button>
          ) : (
            <>
              <Badge variant="warning">Archived</Badge>
              <Button variant="secondary" onClick={handleRestore} disabled={updateSupplier.isPending}>
                <ArchiveRestore className="size-4" strokeWidth={1.5} aria-hidden="true" />
                Restore
              </Button>
            </>
          )
        }
      />
      <SupplierContact supplier={supplier} displayName={name} onUpdate={handleUpdate} />
      <SupplierIngredients supplierId={supplierId} supplierName={name} />
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
    </Page>
  );
}
