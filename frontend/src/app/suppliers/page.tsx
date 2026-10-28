'use client';

import { useState, useEffect } from 'react';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { Plus, Upload, Download, Truck } from 'lucide-react';
import { useSuppliers } from '@/lib/hooks';
import { Page, SectionHeader } from '@/components/app';
import { SearchInput, Button, Skeleton, ViewToggle, Checkbox, DropdownButton, EmptyState, Pagination } from '@/components/ui';
import { AddSupplierModal, FMHSupplierImportModal, SupplierListRow } from '@/components/suppliers';
import { SupplierCard } from '@/components/catalogue';
import { toast } from 'sonner';
import { downloadFMHSampleSupplier, downloadFMHSampleSupplierPricings } from '@/lib/api';
import { triggerBlobDownload } from '@/lib/utils';

type ViewType = 'grid' | 'list';

const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_COUNT = 6;
const GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

export default function SuppliersPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [pageNumber, setPageNumber] = useState(1);
  useEffect(() => setPageNumber(1), [debouncedSearch]);

  const { data, isLoading, error } = useSuppliers({
    active_only: !showArchived,
    page_size: PAGE_SIZE,
    page_number: pageNumber,
    search: debouncedSearch || undefined,
  });
  const filteredSuppliers = data?.items ?? [];
  const [showForm, setShowForm] = useState(false);
  const [showFMHImport, setShowFMHImport] = useState(false);
  const [downloadingSupplier, setDownloadingSupplier] = useState(false);
  const [downloadingPricings, setDownloadingPricings] = useState(false);
  const [view, setView] = useState<ViewType>('grid');

  const handleDownloadSampleSupplier = async () => {
    setDownloadingSupplier(true);
    try {
      const blob = await downloadFMHSampleSupplier();
      triggerBlobDownload(blob, 'Suppliers_sample.xlsx');
    } catch {
      toast.error('Failed to download sample supplier file');
    } finally {
      setDownloadingSupplier(false);
    }
  };

  const handleDownloadSamplePricings = async () => {
    setDownloadingPricings(true);
    try {
      const blob = await downloadFMHSampleSupplierPricings();
      triggerBlobDownload(blob, 'SponsoredSupplierPricings_sample.xlsx');
    } catch {
      toast.error('Failed to download sample supplier pricings file');
    } finally {
      setDownloadingPricings(false);
    }
  };

  if (error) {
    return (
      <Page>
        <EmptyState icon={Truck} title="Suppliers failed to load" description="Check your connection and try again." />
      </Page>
    );
  }

  // Also rendered as the Suppliers tab of /ingredients, whose tab body clips overflow, so the
  // list owns its scroll.
  return (
    <div className="h-full w-full overflow-y-auto">
      <Page>
        <SectionHeader
          title="Suppliers"
          description="The suppliers you buy ingredients from, with their contact details and pack pricing."
          actions={
            <>
              <DropdownButton
                label="FMH"
                items={[
                  {
                    label: downloadingSupplier ? 'Downloading…' : 'Export sample suppliers',
                    icon: <Download className="size-3.5" strokeWidth={1.5} />,
                    onClick: handleDownloadSampleSupplier,
                    disabled: downloadingSupplier,
                  },
                  {
                    label: downloadingPricings ? 'Downloading…' : 'Export sample supplier pricings',
                    icon: <Download className="size-3.5" strokeWidth={1.5} />,
                    onClick: handleDownloadSamplePricings,
                    disabled: downloadingPricings,
                  },
                  {
                    label: 'Import',
                    icon: <Upload className="size-3.5" strokeWidth={1.5} />,
                    onClick: () => setShowFMHImport(true),
                  },
                ]}
              />
              <Button onClick={() => setShowForm(true)}>
                <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
                Add supplier
              </Button>
            </>
          }
        />
        <AddSupplierModal isOpen={showForm} onClose={() => setShowForm(false)} />
        <FMHSupplierImportModal isOpen={showFMHImport} onClose={() => setShowFMHImport(false)} />
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder="Search suppliers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              label="Show archived"
            />

            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          view === 'grid' ? (
            <div className={GRID_CLASSES}>
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          )
        )}

        {/* Empty State */}
        {!isLoading && filteredSuppliers.length === 0 && (
          search ? (
            <EmptyState icon={Truck} title="No suppliers match your search" description="Try a different name or code." />
          ) : (
            <EmptyState
              icon={Truck}
              title="No suppliers yet"
              description="Add one, or import your FMH supplier list."
              action={
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  Add supplier
                </Button>
              }
            />
          )
        )}

        {/* Suppliers List */}
        {!isLoading && filteredSuppliers.length > 0 && (
          view === 'grid' ? (
            <div className={GRID_CLASSES}>
              {filteredSuppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              {filteredSuppliers.map((supplier) => (
                <SupplierListRow key={supplier.id} supplier={supplier} />
              ))}
            </div>
          )
        )}

        {/* Pagination */}
        {data && (
          <Pagination
            pageNumber={data.page_number}
            totalPages={data.total_pages}
            totalCount={data.total_count}
            currentPageSize={data.current_page_size}
            onPageChange={setPageNumber}
          />
        )}
      </Page>
    </div>
  );
}
