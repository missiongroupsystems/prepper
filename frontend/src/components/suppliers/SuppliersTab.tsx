'use client';

/**
 * Ingredients → Suppliers: who the kitchen buys from. Added in a panel or imported from FMH,
 * opened on their own page to edit, archived from the card's menu.
 */
import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { useSuppliers, useUpdateSupplier, useDeactivateSupplier } from '@/lib/hooks';
import { ImportMenu } from '@/components/lists/ImportMenu';
import { ReferenceListView, type ListView } from '@/components/lists/ReferenceListView';
import { downloadFMHSampleSupplier, downloadFMHSampleSupplierPricings } from '@/lib/api';
import { triggerBlobDownload } from '@/lib/utils';
import { supplierDisplayName } from '@/lib/format/displayName';
import type { Supplier } from '@/types';
import { AddSupplierModal } from './AddSupplierModal';
import { FMHSupplierImportModal } from './FMHSupplierImportModal';
import { SupplierCard, SupplierListRow } from './SupplierCard';

const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;

export function SuppliersTab() {
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [pageNumber, setPageNumber] = useState(1);
  useEffect(() => setPageNumber(1), [debouncedSearch, showArchived]);

  const { data, isLoading, error } = useSuppliers({
    active_only: !showArchived,
    page_size: PAGE_SIZE,
    page_number: pageNumber,
    search: debouncedSearch || undefined,
  });
  const updateSupplier = useUpdateSupplier();
  const deactivateSupplier = useDeactivateSupplier();
  const [showForm, setShowForm] = useState(false);
  const [showFMHImport, setShowFMHImport] = useState(false);
  const [downloading, setDownloading] = useState<'suppliers' | 'pricings' | null>(null);
  const [view, setView] = useState<ListView>('grid');

  const download = async (kind: 'suppliers' | 'pricings') => {
    setDownloading(kind);
    try {
      if (kind === 'suppliers') triggerBlobDownload(await downloadFMHSampleSupplier(), 'Suppliers_sample.xlsx');
      else triggerBlobDownload(await downloadFMHSampleSupplierPricings(), 'SponsoredSupplierPricings_sample.xlsx');
    } catch {
      toast.error(kind === 'suppliers' ? 'Failed to download sample supplier file' : 'Failed to download sample supplier pricings file');
    } finally {
      setDownloading(null);
    }
  };

  const handleArchive = (supplier: Supplier) => {
    const { name } = supplierDisplayName(supplier);
    deactivateSupplier.mutate(supplier.id, {
      onSuccess: () => toast.success(`${name} archived`),
      onError: () => toast.error('Failed to archive supplier'),
    });
  };

  const handleUnarchive = (supplier: Supplier) => {
    const { name } = supplierDisplayName(supplier);
    updateSupplier.mutate(
      { id: supplier.id, data: { is_active: true } },
      {
        onSuccess: () => toast.success(`${name} restored`),
        onError: () => toast.error('Failed to restore supplier'),
      }
    );
  };

  return (
    <ReferenceListView
      title="Suppliers"
      description="Who you buy from. Open a supplier to see the ingredients and prices they carry."
      noun="suppliers"
      icon={Truck}
      emptyDescription="Add one, or import your FMH supplier list."
      onAdd={() => setShowForm(true)}
      addLabel="Add supplier"
      headerExtras={
        <ImportMenu
          groups={[
            [{ kind: 'import', label: 'Import FMH suppliers', onSelect: () => setShowFMHImport(true) }],
            [
              {
                kind: 'download',
                label: downloading === 'suppliers' ? 'Downloading…' : 'Export sample suppliers',
                onSelect: () => download('suppliers'),
                disabled: downloading !== null,
              },
              {
                kind: 'download',
                label: downloading === 'pricings' ? 'Downloading…' : 'Export sample supplier pricings',
                onSelect: () => download('pricings'),
                disabled: downloading !== null,
              },
            ],
          ]}
        />
      }
      search={search}
      onSearchChange={setSearch}
      showArchived={showArchived}
      onShowArchivedChange={setShowArchived}
      view={view}
      onViewChange={setView}
      items={data?.items ?? []}
      isLoading={isLoading}
      error={error}
      renderItem={(supplier, itemView) => {
        const Item = itemView === 'grid' ? SupplierCard : SupplierListRow;
        return <Item key={supplier.id} supplier={supplier} onArchive={handleArchive} onUnarchive={handleUnarchive} />;
      }}
      page={data}
      onPageChange={setPageNumber}
    >
      <AddSupplierModal isOpen={showForm} onClose={() => setShowForm(false)} />
      <FMHSupplierImportModal isOpen={showFMHImport} onClose={() => setShowFMHImport(false)} />
    </ReferenceListView>
  );
}
