'use client';

import { useState } from 'react';
import { MoreHorizontal, Plus, Store, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppState } from '@/lib/store';
import { useRecipe, useRecipeOutlets, useRemoveRecipeFromOutlet, useUpdateRecipeOutlet } from '@/lib/hooks';
import { SectionHeader } from '@/components/app';
import {
  Badge,
  Button,
  ConfirmModal,
  EditableCell,
  EmptyState,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { RecipeTabPage, RecipeTabState } from '@/components/recipe-tabs/RecipeTabPage';
import { AddOutletPanel } from './AddOutletPanel';
import { formatDisplayName } from '@/lib/format/displayName';
import { formatCurrency } from '@/lib/utils';
import type { Outlet } from '@/types';

const ICON = { className: 'size-4', strokeWidth: 1.5, 'aria-hidden': 'true' } as const;

interface OutletsTabProps {
  outlets?: Outlet[];
}

export function OutletsTab({ outlets = [] }: OutletsTabProps) {
  const { selectedRecipeId } = useAppState();
  const { data: recipe, isLoading: recipeLoading, error: recipeError } = useRecipe(selectedRecipeId);
  const {
    data: recipeOutlets = [],
    isLoading: outletsLoading,
    error: outletsError,
  } = useRecipeOutlets(selectedRecipeId);
  const removeRecipeFromOutlet = useRemoveRecipeFromOutlet();
  const updateRecipeOutlet = useUpdateRecipeOutlet();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [removing, setRemoving] = useState<{ id: number; name: string } | null>(null);

  const subject = 'the outlets it is on';
  if (!selectedRecipeId) return <RecipeTabState state="unselected" subject={subject} icon={Store} />;
  if (recipeLoading || outletsLoading) return <RecipeTabState state="loading" subject={subject} />;
  if (recipeError || outletsError || !recipe) return <RecipeTabState state="error" subject={subject} icon={Store} />;

  const outletsById = new Map(outlets.map((outlet) => [outlet.id, outlet]));
  const linkedIds = new Set(recipeOutlets.map((ro) => ro.outlet_id));
  const outletName = (id: number) => {
    const outlet = outletsById.get(id);
    return outlet ? formatDisplayName(outlet.name) : `Outlet ${id}`;
  };

  const savePrice = (outletId: number, value: string) => {
    const price = parseFloat(value);
    updateRecipeOutlet.mutate(
      { recipeId: selectedRecipeId, outletId, data: { price_override: isNaN(price) ? null : price } },
      { onError: () => toast.error('Could not save the price') }
    );
  };

  const confirmRemove = () => {
    if (!removing) return;
    removeRecipeFromOutlet.mutate(
      { recipeId: selectedRecipeId, outletId: removing.id },
      {
        onSuccess: () => setRemoving(null),
        onError: () => toast.error('Could not remove the outlet'),
      }
    );
  };

  const addButton = (
    <Button onClick={() => setIsAddOpen(true)}>
      <Plus {...ICON} />
      Add outlet
    </Button>
  );

  return (
    <RecipeTabPage>
      <SectionHeader
        eyebrow={recipe.name}
        title="Outlets"
        description="Where this recipe is sold, and at what price. Click a price to change it."
        actions={recipeOutlets.length > 0 && addButton}
      />

      {recipeOutlets.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Not on any outlet yet"
          description="Add an outlet to put this recipe on its menu."
          action={addButton}
        />
      ) : (
        <Table framed aria-label="Outlets">
          <TableHeader>
            <TableRow>
              <TableHead>Outlet</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead numeric>Price override</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipeOutlets.map((ro) => {
              const name = outletName(ro.outlet_id);
              return (
                <TableRow key={ro.outlet_id}>
                  <TableCell>{name}</TableCell>
                  <TableCell className="font-mono text-xs text-tertiary">
                    {outletsById.get(ro.outlet_id)?.code ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ro.is_active ? 'success' : 'neutral'}>{ro.is_active ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  <TableCell numeric>
                    <EditableCell
                      type="number"
                      value={ro.price_override?.toString() ?? ''}
                      displayValue={ro.price_override != null ? formatCurrency(ro.price_override) : '—'}
                      placeholder="0.00"
                      onSave={(value) => savePrice(ro.outlet_id, value)}
                      className="inline-block w-28 text-right"
                    />
                  </TableCell>
                  <TableCell className="w-12 text-right">
                    <Menu
                      label={`${name} actions`}
                      trigger={(props) => (
                        <Button variant="ghost" size="icon-sm" aria-label={`${name} actions`} {...props}>
                          <MoreHorizontal {...ICON} />
                        </Button>
                      )}
                    >
                      <MenuItem icon={Trash2} danger onSelect={() => setRemoving({ id: ro.outlet_id, name })}>
                        Remove from outlet
                      </MenuItem>
                    </Menu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <AddOutletPanel
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        recipeId={selectedRecipeId}
        outlets={outlets.filter((outlet) => !linkedIds.has(outlet.id))}
      />
      <ConfirmModal
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        title="Remove from outlet?"
        message={`${recipe.name} will come off ${removing?.name ?? 'this outlet'}'s menu. You can add it back at any time.`}
        confirmLabel="Remove"
        variant="destructive"
        pending={removeRecipeFromOutlet.isPending}
      />
    </RecipeTabPage>
  );
}
