'use client';

/**
 * AddOutletPanel — puts the recipe on an outlet's menu, optionally at its own price. A SidePanel,
 * so the outlets table stays in view; the outlet picker searches once the list is long.
 */
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { useAddRecipeToOutlet } from '@/lib/hooks';
import { Button, FieldHint, Input, Label, PendingButton, Select, SidePanel } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Outlet } from '@/types';

interface AddOutletPanelProps {
  open: boolean;
  onClose: () => void;
  recipeId: number;
  /** Outlets the recipe is not on yet. */
  outlets: Outlet[];
}

export function AddOutletPanel({ open, onClose, recipeId, outlets }: AddOutletPanelProps) {
  const [outletId, setOutletId] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const addRecipeToOutlet = useAddRecipeToOutlet();
  const outletFieldId = useId();
  const priceFieldId = useId();
  const priceHintId = useId();

  const close = () => {
    setOutletId('');
    setPriceOverride('');
    onClose();
  };

  const submit = () => {
    if (!outletId) return;
    const price = parseFloat(priceOverride);
    addRecipeToOutlet.mutate(
      {
        recipeId,
        data: { outlet_id: Number(outletId), is_active: true, price_override: isNaN(price) ? null : price },
      },
      {
        onSuccess: close,
        onError: () => toast.error('Could not add the outlet'),
      }
    );
  };

  return (
    <SidePanel
      open={open}
      onClose={close}
      title="Add outlet"
      description="Put this recipe on an outlet's menu."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={addRecipeToOutlet.isPending}>
            Cancel
          </Button>
          <PendingButton onClick={submit} disabled={!outletId} pending={addRecipeToOutlet.isPending}>
            Add outlet
          </PendingButton>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={outletFieldId}>Outlet</Label>
          {outlets.length === 0 ? (
            <FieldHint>This recipe is already on every outlet you can see.</FieldHint>
          ) : (
            <Select
              id={outletFieldId}
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              options={[
                { value: '', label: 'Choose an outlet' },
                ...outlets.map((outlet) => ({
                  value: String(outlet.id),
                  label: `${formatDisplayName(outlet.name)} (${outlet.code})`,
                })),
              ]}
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={priceFieldId}>Price override</Label>
          <Input
            id={priceFieldId}
            inputMode="decimal"
            placeholder="0.00"
            value={priceOverride}
            onChange={(e) => setPriceOverride(e.target.value)}
            aria-describedby={priceHintId}
            className="tabular-nums"
          />
          <FieldHint id={priceHintId}>Optional. Leave empty to use the recipe&rsquo;s own price.</FieldHint>
        </div>
      </div>
    </SidePanel>
  );
}
