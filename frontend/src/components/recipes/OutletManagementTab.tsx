'use client';

/**
 * Settings → Outlets: brands and the locations under them. Admins add outlets in a panel and
 * archive them; everyone else sees their own outlet and its children, read-only. An outlet is
 * edited on its own page.
 */
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useOutlets, useUpdateOutlet, useDeactivateOutlet, useUser } from '@/lib/hooks';
import { useAppState } from '@/lib/store';
import { OutletCard, OutletListRow, AddOutletModal } from '@/components/outlets';
import { Button, Checkbox } from '@/components/ui';
import { CardGrid, ListGroup, ListStack } from '@/components/lists/ListLayout';
import { ReferenceListView, type ListView } from '@/components/lists/ReferenceListView';
import type { Outlet } from '@/types';

const PAGE_SIZE = 30;

interface OutletManagementTabProps {
  userType?: 'normal' | 'admin' | null;
}

export function OutletManagementTab({ userType }: OutletManagementTabProps) {
  const deactivateOutlet = useDeactivateOutlet();
  const updateOutlet = useUpdateOutlet();
  const { userId } = useAppState();
  const { data: currentUser } = useUser(userId);
  const isAdmin = userType === 'admin';

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [view, setView] = useState<ListView>('grid');
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());
  const [groupByBrands, setGroupByBrands] = useState(false);
  const { data: outletsData, isLoading, error } = useOutlets({ is_active: showArchived ? undefined : true, page_size: PAGE_SIZE });
  const outlets = useMemo(() => outletsData?.items ?? [], [outletsData]);
  const outletsById = useMemo(() => new Map(outlets.map((o) => [o.id, o])), [outlets]);
  const parentName = (outlet: Outlet) =>
    outlet.parent_outlet_id !== null ? outletsById.get(outlet.parent_outlet_id)?.name : undefined;

  const filteredOutlets = useMemo(() => {
    const needle = search.toLowerCase();
    const scopeId = !isAdmin ? currentUser?.outlet_id : undefined;
    return outlets.filter((outlet) => {
      // A non-admin sees their own outlet and the outlets directly under it.
      if (scopeId && outlet.id !== scopeId && outlet.parent_outlet_id !== scopeId) return false;
      return !needle || outlet.name.toLowerCase().includes(needle);
    });
  }, [outlets, search, isAdmin, currentUser?.outlet_id]);

  const toggleParentExpanded = (parentId: number) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  const handleArchive = (outlet: Outlet) => {
    deactivateOutlet.mutate(outlet.id, {
      onSuccess: () => toast.success(`${outlet.name} archived`),
      onError: () => toast.error(`Failed to archive ${outlet.name}`),
    });
  };

  const handleUnarchive = (outlet: Outlet) => {
    updateOutlet.mutate(
      { id: outlet.id, data: { is_active: true } },
      {
        onSuccess: () => toast.success(`${outlet.name} unarchived`),
        onError: () => toast.error(`Failed to unarchive ${outlet.name}`),
      }
    );
  };

  const card = (outlet: Outlet) => (
    <OutletCard
      key={outlet.id}
      outlet={outlet}
      parentOutletName={parentName(outlet)}
      onArchive={isAdmin ? handleArchive : undefined}
      onUnarchive={isAdmin ? handleUnarchive : undefined}
    />
  );

  const brandGroups = (items: Outlet[]) => {
    const groups = new Map<number | null, Outlet[]>();
    for (const outlet of items) {
      const brandId = outlet.outlet_type === 'brand' ? outlet.id : outlet.parent_outlet_id;
      groups.set(brandId, [...(groups.get(brandId) ?? []), outlet]);
    }
    return Array.from(groups.entries()).map(([brandId, group]) => {
      const brand = brandId !== null ? outletsById.get(brandId) : undefined;
      // The brand card first, then its locations.
      const ordered = [...group].sort((a, b) => Number(b.id === brandId) - Number(a.id === brandId));
      return (
        <ListGroup key={brandId ?? 'ungrouped'} title={brand?.name ?? 'No brand'} count={ordered.length}>
          <CardGrid>{ordered.map(card)}</CardGrid>
        </ListGroup>
      );
    });
  };

  const hierarchy = (items: Outlet[]) => {
    const visible = new Set(items.map((o) => o.id));
    const roots = items.filter((o) => o.parent_outlet_id === null || !visible.has(o.parent_outlet_id));
    return (
      <ListStack>
        {roots.map((parent) => {
          const children = items.filter((o) => o.parent_outlet_id === parent.id);
          const isExpanded = expandedParents.has(parent.id);
          return (
            <div key={parent.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {children.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => toggleParentExpanded(parent.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Hide' : 'Show'} ${children.length} outlets under ${parent.name}`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4" strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </Button>
                ) : (
                  <span className="size-8 shrink-0 max-sm:size-10" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <OutletListRow outlet={parent} parentOutletName={parentName(parent)} />
                </div>
              </div>
              {isExpanded && (
                <div className="ml-4 flex flex-col gap-2 border-l border-line pl-6">
                  {children.map((child) => (
                    <OutletListRow key={child.id} outlet={child} parentOutletName={parent.name} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </ListStack>
    );
  };

  return (
    <ReferenceListView
      title="Outlets"
      description={isAdmin ? 'Brands and the locations under them.' : 'Your outlet and the outlets under it.'}
      noun="outlets"
      icon={Store}
      onAdd={isAdmin ? () => setShowForm(true) : undefined}
      addLabel="Add outlet"
      search={search}
      onSearchChange={setSearch}
      showArchived={showArchived}
      onShowArchivedChange={setShowArchived}
      view={view}
      onViewChange={setView}
      toolbarExtras={
        view === 'grid' && (
          <Checkbox checked={groupByBrands} onChange={(e) => setGroupByBrands(e.target.checked)} label="Group by brand" />
        )
      }
      items={filteredOutlets}
      isLoading={isLoading}
      error={error}
      renderItem={card}
      renderBody={(items, bodyView) =>
        bodyView === 'list' ? hierarchy(items) : groupByBrands ? <div className="flex flex-col gap-8">{brandGroups(items)}</div> : <CardGrid>{items.map(card)}</CardGrid>
      }
    >
      <AddOutletModal isOpen={showForm} onClose={() => setShowForm(false)} />
    </ReferenceListView>
  );
}
