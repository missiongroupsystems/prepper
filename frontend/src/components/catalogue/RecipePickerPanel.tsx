'use client';

/**
 * RecipePickerPanel — adds a dish to an outlet or a recipe category, in a SidePanel. The recipe
 * Select searches its own list; outlets also take an optional price override.
 */
import { useId, useState, type FormEvent } from 'react';
import { Button, FieldHint, Input, Label, PendingButton, Select, SidePanel, type SelectOption } from '@/components/ui';

export interface RecipePickerValues {
  recipeId: number;
  /** Only set when the panel asks for it. */
  priceOverride: number | null;
}

interface RecipePickerPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Names the outlet or category the recipe joins. */
  description: string;
  recipeOptions: SelectOption[];
  withPriceOverride?: boolean;
  submitLabel: string;
  pending: boolean;
  /** Resolves `true` when the recipe was added, so the form resets and closes. */
  onSubmit: (values: RecipePickerValues) => Promise<boolean>;
}

export function RecipePickerPanel({
  open,
  onClose,
  title,
  description,
  recipeOptions,
  withPriceOverride = false,
  submitLabel,
  pending,
  onSubmit,
}: RecipePickerPanelProps) {
  const formId = useId();
  const recipeFieldId = useId();
  const priceFieldId = useId();
  const [recipeId, setRecipeId] = useState('');
  const [price, setPrice] = useState('');

  const close = () => {
    setRecipeId('');
    setPrice('');
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!recipeId) return;
    const parsed = parseFloat(price);
    const added = await onSubmit({
      recipeId: parseInt(recipeId, 10),
      priceOverride: withPriceOverride && Number.isFinite(parsed) ? parsed : null,
    });
    if (added) close();
  };

  return (
    <SidePanel
      open={open}
      onClose={close}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <PendingButton type="submit" form={formId} disabled={!recipeId} pending={pending}>
            {submitLabel}
          </PendingButton>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={recipeFieldId}>Dish</Label>
          <Select
            id={recipeFieldId}
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            searchable
            searchPlaceholder="Search dishes…"
            options={[{ value: '', label: 'Select a dish…' }, ...recipeOptions]}
          />
          {recipeOptions.length === 0 && <FieldHint>Every dish in the list is already added.</FieldHint>}
        </div>
        {withPriceOverride && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={priceFieldId}>Price override</Label>
            <Input
              id={priceFieldId}
              inputMode="decimal"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-describedby={`${priceFieldId}-hint`}
              className="text-right tabular-nums"
            />
            <FieldHint id={`${priceFieldId}-hint`}>Optional. Leave blank to sell at the dish&apos;s own price.</FieldHint>
          </div>
        )}
      </form>
    </SidePanel>
  );
}
