'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAddSupplierIngredient,
  useIngredients,
  useOutlets,
  useRemoveSupplierIngredient,
  useSupplierIngredients,
  useUpdateSupplierIngredient,
} from '@/lib/hooks';
import { useAppState } from '@/lib/store';
import { Button } from '@/components/ui';
import { SupplierLinkPanel, SupplierLinksTable, isDuplicateLinkError, type SupplierLinkValues } from '@/components/catalogue';
import { formatDisplayName } from '@/lib/format/displayName';
import type { SupplierIngredient, UpdateSupplierIngredientRequest } from '@/types';

const PICKER_PAGE_SIZE = 30;

export function SupplierIngredients({ supplierId, supplierName }: { supplierId: number; supplierName: string }) {
  const { outletId } = useAppState();
  const [panelOpen, setPanelOpen] = useState(false);
  const { data: links = [] } = useSupplierIngredients(supplierId);
  // Archived ingredients can still be bought, so the picker includes them.
  const { data: ingredientsData } = useIngredients({ active_only: false, page_size: PICKER_PAGE_SIZE });
  const { data: outletsData } = useOutlets({ page_size: PICKER_PAGE_SIZE });

  const addLink = useAddSupplierIngredient();
  const updateLink = useUpdateSupplierIngredient();
  const removeLink = useRemoveSupplierIngredient();

  const linkedIngredientIds = new Set(links.map((l) => l.ingredient_id));
  const ingredientOptions = (ingredientsData?.items ?? [])
    .filter((i) => !linkedIngredientIds.has(i.id))
    .map((i) => ({ value: String(i.id), label: formatDisplayName(i.name) }));
  const outletOptions = (outletsData?.items ?? []).map((o) => ({ value: String(o.id), label: formatDisplayName(o.name) }));

  const handleUpdate = (link: SupplierIngredient, data: UpdateSupplierIngredientRequest) => {
    updateLink.mutate(
      { supplierId, supplierIngredientId: link.id, ingredientId: link.ingredient_id, data },
      { onError: () => toast.error('Failed to update the ingredient link') }
    );
  };

  const handleRemove = async (link: SupplierIngredient) => {
    try {
      await removeLink.mutateAsync({ supplierId, supplierIngredientId: link.id, ingredientId: link.ingredient_id });
      toast.success('Ingredient link removed');
    } catch {
      toast.error('Failed to remove the ingredient link');
    }
  };

  const handleAdd = async (values: SupplierLinkValues) => {
    const name = ingredientOptions.find((o) => o.value === String(values.counterpartId))?.label ?? 'Ingredient';
    try {
      await addLink.mutateAsync({
        supplierId,
        data: {
          ingredient_id: values.counterpartId,
          supplier_id: supplierId,
          outlet_id: values.outletId,
          sku: values.sku,
          pack_size: values.packSize,
          pack_unit: values.packUnit,
          price_per_pack: values.pricePerPack,
          is_preferred: values.isPreferred,
        },
      });
      toast.success(`${name} linked`);
      return true;
    } catch (error) {
      toast.error(isDuplicateLinkError(error) ? `${name} is already linked to this supplier` : 'Failed to link ingredient');
      return false;
    }
  };

  return (
    <section className="flex flex-col gap-3" aria-labelledby="supplier-ingredients">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="supplier-ingredients" className="text-lg">
          Ingredients
        </h2>
        <Button variant="secondary" onClick={() => setPanelOpen(true)}>
          <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Link ingredient
        </Button>
      </div>
      <SupplierLinksTable
        links={links}
        counterpart="ingredient"
        onUpdate={handleUpdate}
        onRemove={handleRemove}
        empty="No ingredients linked yet. Link the ingredients this supplier sells, with their pack pricing."
      />
      <SupplierLinkPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        counterpartLabel="Ingredient"
        counterpartOptions={ingredientOptions}
        outletOptions={outletOptions}
        lockedOutletId={outletId ?? null}
        description={supplierName}
        pending={addLink.isPending}
        onSubmit={handleAdd}
      />
    </section>
  );
}
