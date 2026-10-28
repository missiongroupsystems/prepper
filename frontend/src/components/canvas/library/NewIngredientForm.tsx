'use client';

import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Button, Input, Label, Select } from '@/components/ui';
import { useCategorizeIngredient, useCreateIngredient } from '@/lib/hooks';

const UNIT_OPTIONS = [
  { value: 'g', label: 'g (grams)' },
  { value: 'kg', label: 'kg (kilograms)' },
  { value: 'ml', label: 'ml (milliliters)' },
  { value: 'l', label: 'l (liters)' },
  { value: 'pcs', label: 'pcs (pieces)' },
];

/** Inline create in the library: the category agent files the new ingredient. */
export function NewIngredientForm({ onClose }: { onClose: () => void }) {
  const createIngredient = useCreateIngredient();
  const categorizeIngredient = useCategorizeIngredient();
  const [name, setName] = useState('');
  const [baseUnit, setBaseUnit] = useState('g');
  const [cost, setCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const id = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const { category_id } = await categorizeIngredient.mutateAsync(name);
      await createIngredient.mutateAsync({
        name: name.trim(),
        base_unit: baseUnit,
        cost_per_base_unit: cost ? parseFloat(cost) : null,
        category_id,
      });
      toast.success('Ingredient created');
      onClose();
    } catch {
      toast.error('Failed to create ingredient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-card p-3 hairline">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-name`}>Name</Label>
        <Input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-unit`}>Base unit</Label>
          <Select id={`${id}-unit`} value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)} options={UNIT_OPTIONS} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-cost`}>Cost per unit</Label>
          <Input
            id={`${id}-cost`}
            type="text"
            inputMode="decimal"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            onBlur={() => {
              const n = parseFloat(cost);
              if (!isNaN(n)) setCost(String(n));
            }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting || categorizeIngredient.isPending}>
          Add
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
