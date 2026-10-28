'use client';

/**
 * The ingredient's supplier links. When a link's pricing changes, the ingredient's stored unit
 * cost is re-derived as the median of the links priced in its base unit.
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAddIngredientSupplier,
  useOutlets,
  useRemoveIngredientSupplier,
  useSuppliers,
  useUpdateIngredient,
  useUpdateIngredientSupplier,
} from '@/lib/hooks';
import { useAppState } from '@/lib/store';
import { Button } from '@/components/ui';
import {
  SupplierLinkPanel,
  SupplierLinksTable,
  isDuplicateLinkError,
  medianUnitCost,
  type SupplierLinkValues,
} from '@/components/catalogue';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Ingredient, SupplierIngredient, UpdateSupplierIngredientRequest } from '@/types';

const PICKER_PAGE_SIZE = 30;
const DEFAULT_CURRENCY = 'SGD';
const MANUAL_SOURCE = 'manual';

type PricedLink = Pick<SupplierIngredient, 'pack_unit' | 'pack_size' | 'price_per_pack'>;

export function IngredientSuppliers({ ingredient, links }: { ingredient: Ingredient; links: SupplierIngredient[] }) {
  const { outletId } = useAppState();
  const [panelOpen, setPanelOpen] = useState(false);
  const { data: suppliersData } = useSuppliers({ page_size: PICKER_PAGE_SIZE });
  const { data: outletsData } = useOutlets({ page_size: PICKER_PAGE_SIZE });

  const addLink = useAddIngredientSupplier();
  const updateLink = useUpdateIngredientSupplier();
  const removeLink = useRemoveIngredientSupplier();
  const updateIngredient = useUpdateIngredient();

  const linkedSupplierIds = new Set(links.map((l) => l.supplier_id));
  const supplierOptions = (suppliersData?.items ?? [])
    .filter((s) => !linkedSupplierIds.has(s.id))
    .map((s) => ({ value: String(s.id), label: formatDisplayName(s.name) }));
  const outletOptions = (outletsData?.items ?? []).map((o) => ({ value: String(o.id), label: formatDisplayName(o.name) }));

  const syncCost = (next: PricedLink[]) => {
    const cost = medianUnitCost(next, ingredient.base_unit);
    if (cost === ingredient.cost_per_base_unit) return;
    updateIngredient.mutate({ id: ingredient.id, data: { cost_per_base_unit: cost } });
  };

  const handleUpdate = (link: SupplierIngredient, data: UpdateSupplierIngredientRequest) => {
    updateLink.mutate(
      { ingredientId: ingredient.id, supplierIngredientId: link.id, data },
      {
        onSuccess: () => {
          const pricingChanged = data.price_per_pack !== undefined || data.pack_size !== undefined || data.pack_unit !== undefined;
          if (pricingChanged) syncCost(links.map((l) => (l.id === link.id ? { ...l, ...data } : l)));
        },
        onError: () => toast.error('Failed to update the supplier link'),
      }
    );
  };

  const handleRemove = async (link: SupplierIngredient) => {
    try {
      await removeLink.mutateAsync({ ingredientId: ingredient.id, supplierIngredientId: link.id });
      syncCost(links.filter((l) => l.id !== link.id));
      toast.success('Supplier link removed');
    } catch {
      toast.error('Failed to remove the supplier link');
    }
  };

  const handleAdd = async (values: SupplierLinkValues) => {
    const name = supplierOptions.find((o) => o.value === String(values.counterpartId))?.label ?? 'Supplier';
    try {
      await addLink.mutateAsync({
        ingredientId: ingredient.id,
        data: {
          ingredient_id: ingredient.id,
          supplier_id: values.counterpartId,
          outlet_id: values.outletId,
          sku: values.sku,
          pack_size: values.packSize,
          pack_unit: values.packUnit,
          price_per_pack: values.pricePerPack,
          currency: DEFAULT_CURRENCY,
          is_preferred: values.isPreferred,
          source: MANUAL_SOURCE,
        },
      });
      syncCost([...links, { pack_unit: values.packUnit, pack_size: values.packSize, price_per_pack: values.pricePerPack }]);
      toast.success(`${name} linked`);
      return true;
    } catch (error) {
      toast.error(isDuplicateLinkError(error) ? `${name} is already a supplier for this ingredient` : 'Failed to link supplier');
      return false;
    }
  };

  return (
    <section className="flex flex-col gap-3" aria-labelledby="ingredient-suppliers">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="ingredient-suppliers" className="text-lg">
          Suppliers
        </h2>
        <Button variant="secondary" onClick={() => setPanelOpen(true)}>
          <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Link supplier
        </Button>
      </div>
      <SupplierLinksTable
        links={links}
        counterpart="supplier"
        onUpdate={handleUpdate}
        onRemove={handleRemove}
        empty="No suppliers linked yet. Link one to price this ingredient by the pack."
      />
      <SupplierLinkPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        counterpartLabel="Supplier"
        counterpartOptions={supplierOptions}
        outletOptions={outletOptions}
        lockedOutletId={outletId ?? null}
        description={formatDisplayName(ingredient.name)}
        pending={addLink.isPending}
        onSubmit={handleAdd}
      />
    </section>
  );
}
