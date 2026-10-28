'use client';

import { use } from 'react';
import { toast } from 'sonner';
import { useOutlet, useOutletRecipes, useOutlets, useParentOutletRecipes, useRecipes, useUpdateOutlet } from '@/lib/hooks';
import { Page, SectionHeader } from '@/components/app';
import { Badge } from '@/components/ui';
import { DetailLoadError, DetailSkeleton } from '@/components/catalogue';
import { formatDisplayName } from '@/lib/format/displayName';
import type { UpdateOutletRequest } from '@/types';
import { OutletDetails } from './_components/OutletDetails';
import { OutletRecipes } from './_components/OutletRecipes';

const LIST_PAGE_SIZE = 30;
const FORBIDDEN_STATUS = 403;

function statusOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  if ('response' in error && typeof error.response === 'object' && error.response !== null && 'status' in error.response) {
    return (error.response as { status: number }).status;
  }
  return 'status' in error ? (error as { status: number }).status : undefined;
}

interface OutletPageProps {
  params: Promise<{ id: string }>;
}

export default function OutletPage({ params }: OutletPageProps) {
  const { id } = use(params);
  const outletId = parseInt(id, 10);

  const { data: outlet, isLoading, error } = useOutlet(outletId);
  const { data: allOutletsData } = useOutlets({ page_size: LIST_PAGE_SIZE });
  const { data: outletRecipes = [] } = useOutletRecipes(outletId);
  const { data: parentRecipes = [] } = useParentOutletRecipes(outletId);
  const { data: recipesData } = useRecipes({ page_size: LIST_PAGE_SIZE });
  const updateOutlet = useUpdateOutlet();

  if (error) {
    const forbidden = statusOf(error) === FORBIDDEN_STATUS;
    return (
      <Page>
        <DetailLoadError
          title={forbidden ? 'You do not have access to this outlet' : 'Outlet not found'}
          description={forbidden ? 'Outlets outside your hierarchy are hidden. Ask an admin if you need it.' : undefined}
          backHref="/settings"
          backLabel="Back to settings"
        />
      </Page>
    );
  }

  if (isLoading || !outlet) {
    return (
      <Page>
        <DetailSkeleton />
      </Page>
    );
  }

  const name = formatDisplayName(outlet.name);

  const handleUpdate = (data: UpdateOutletRequest) => {
    updateOutlet.mutate({ id: outletId, data }, { onError: () => toast.error('Failed to save the change') });
  };

  return (
    <Page>
      <SectionHeader
        eyebrow={outlet.outlet_type === 'brand' ? 'Brand' : 'Location'}
        title={name}
        actions={<Badge variant={outlet.is_active ? 'success' : 'neutral'}>{outlet.is_active ? 'Active' : 'Inactive'}</Badge>}
      />
      <OutletDetails outlet={outlet} allOutlets={allOutletsData?.items ?? []} onUpdate={handleUpdate} />
      <OutletRecipes
        outletId={outletId}
        outletName={name}
        outletRecipes={outletRecipes}
        parentRecipes={outlet.parent_outlet_id !== null ? parentRecipes : []}
        recipes={recipesData?.items ?? []}
      />
    </Page>
  );
}
