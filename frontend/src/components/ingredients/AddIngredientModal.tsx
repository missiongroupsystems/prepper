'use client';

/**
 * Add ingredient — a SidePanel (the list stays in view) with two groups: the ingredient itself,
 * then the suppliers it can be bought from. The tag is picked by the categorisation agent on
 * create. Name kept from the modal it replaced so callers are unchanged.
 */
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateIngredient, useAddIngredientSupplier, useSuppliers, useCategorizeIngredient, useOutlets } from '@/lib/hooks';
import { useAppState } from '@/lib/store';
import { Button, Checkbox, Input, Select } from '@/components/ui';
import { FormPanel } from '@/components/forms/FormPanel';
import { FieldRow, FormField, FormSection, fieldA11y } from '@/components/forms/FormField';
import {
  SupplierEntryFields,
  UNIT_OPTIONS,
  missingSupplierFields,
  type SupplierEntry,
  type SupplierEntryField,
} from './SupplierEntryFields';

const LOOKUP_PAGE_SIZE = 30;
const DEFAULT_UNIT = 'g';
const DEFAULT_CURRENCY = 'SGD';

interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddIngredientModal({ isOpen, onClose }: AddIngredientModalProps) {
  const { outletId } = useAppState();
  const createIngredient = useCreateIngredient();
  const addIngredientSupplier = useAddIngredientSupplier();
  const categorizeIngredient = useCategorizeIngredient();
  const { data: suppliersData } = useSuppliers({ page_size: LOOKUP_PAGE_SIZE });
  const suppliers = useMemo(() => suppliersData?.items ?? [], [suppliersData]);
  const { data: outletsData } = useOutlets({ page_size: LOOKUP_PAGE_SIZE });
  const outlets = outletsData?.items ?? [];

  const [name, setName] = useState('');
  const [baseUnit, setBaseUnit] = useState(DEFAULT_UNIT);
  const [cost, setCost] = useState('');
  const [isHalal, setIsHalal] = useState(false);
  const [supplierEntries, setSupplierEntries] = useState<SupplierEntry[]>([]);
  const [attempted, setAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usedSupplierIds = useMemo(() => new Set(supplierEntries.map((e) => e.supplier_id)), [supplierEntries]);
  const canAddSupplier = suppliers.some((s) => !usedSupplierIds.has(s.id.toString()));
  const nameError = attempted && !name.trim() ? 'Ingredient name is required' : undefined;

  const resetForm = () => {
    setName('');
    setBaseUnit(DEFAULT_UNIT);
    setCost('');
    setIsHalal(false);
    setSupplierEntries([]);
    setAttempted(false);
  };

  const handleAddSupplierEntry = () => {
    setSupplierEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        supplier_id: '',
        sku: '',
        pack_size: '',
        pack_unit: baseUnit,
        price_per_pack: '',
        // The first supplier is preferred by default.
        is_preferred: prev.length === 0,
        outlet_id: outletId ? outletId.toString() : '',
      },
    ]);
  };

  const handleRemoveSupplierEntry = (id: string) => {
    setSupplierEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      // Removing the preferred supplier hands the role to the first one left.
      if (updated.length > 0 && !updated.some((e) => e.is_preferred)) {
        updated[0] = { ...updated[0], is_preferred: true };
      }
      return updated;
    });
  };

  const handleSupplierEntryChange = (id: string, field: SupplierEntryField, value: string | boolean) => {
    setSupplierEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)));
  };

  const handleSubmit = async () => {
    setAttempted(true);
    if (!name.trim() || supplierEntries.some((e) => missingSupplierFields(e).length > 0)) return;

    setIsSubmitting(true);
    try {
      const { category_id } = await categorizeIngredient.mutateAsync(name);
      const newIngredient = await createIngredient.mutateAsync({
        name: name.trim(),
        base_unit: baseUnit,
        cost_per_base_unit: cost ? parseFloat(cost) : null,
        is_halal: isHalal,
        category_id,
      });

      for (const entry of supplierEntries) {
        await addIngredientSupplier.mutateAsync({
          ingredientId: newIngredient.id,
          data: {
            ingredient_id: newIngredient.id,
            supplier_id: parseInt(entry.supplier_id, 10),
            outlet_id: parseInt(entry.outlet_id, 10),
            sku: entry.sku || null,
            pack_size: parseFloat(entry.pack_size),
            pack_unit: entry.pack_unit,
            price_per_pack: parseFloat(entry.price_per_pack),
            currency: DEFAULT_CURRENCY,
            is_preferred: entry.is_preferred,
            source: 'manual',
          },
        });
      }

      const count = supplierEntries.length;
      toast.success(count > 0 ? `Ingredient created with ${count} supplier${count > 1 ? 's' : ''}` : 'Ingredient created');
      resetForm();
      onClose();
    } catch {
      toast.error('Failed to create ingredient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormPanel
      open={isOpen}
      onClose={onClose}
      title="Add ingredient"
      description="Its tag is suggested automatically from the name."
      size="lg"
      onSubmit={handleSubmit}
      submitLabel="Create ingredient"
      pending={isSubmitting}
    >
      <FormSection title="Ingredient">
        <FormField id="ingredient-name" label="Name" error={nameError}>
          <Input
            {...fieldA11y('ingredient-name', nameError)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Olive oil, chicken breast"
            autoFocus
          />
        </FormField>
        <FieldRow>
          <FormField id="ingredient-unit" label="Base unit">
            <Select
              {...fieldA11y('ingredient-unit')}
              value={baseUnit}
              onChange={(e) => setBaseUnit(e.target.value)}
              options={UNIT_OPTIONS}
            />
          </FormField>
          <FormField id="ingredient-cost" label="Cost per unit" optional>
            <Input
              {...fieldA11y('ingredient-cost')}
              inputMode="decimal"
              className="tabular-nums"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              onBlur={() => {
                const n = parseFloat(cost);
                if (!Number.isNaN(n)) setCost(String(n));
              }}
              placeholder="0.00"
            />
          </FormField>
        </FieldRow>
        <Checkbox checked={isHalal} onChange={(e) => setIsHalal(e.target.checked)} label="Halal" />
      </FormSection>

      <FormSection
        title="Suppliers"
        description="Optional. Link who sells it and the pack it comes in."
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={handleAddSupplierEntry} disabled={!canAddSupplier}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Add supplier
          </Button>
        }
      >
        {supplierEntries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-tertiary">
            No suppliers linked yet.
          </p>
        ) : (
          supplierEntries.map((entry, index) => (
            <SupplierEntryFields
              key={entry.id}
              entry={entry}
              index={index}
              suppliers={suppliers}
              outlets={outlets}
              outletLocked={!!outletId}
              usedSupplierIds={supplierEntries.filter((e) => e.id !== entry.id).map((e) => e.supplier_id)}
              showErrors={attempted}
              onChange={handleSupplierEntryChange}
              onRemove={handleRemoveSupplierEntry}
            />
          ))
        )}
      </FormSection>
    </FormPanel>
  );
}
