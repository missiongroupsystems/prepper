'use client';

import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useCategories, useCategorizeIngredient } from '@/lib/hooks';
import { Badge, Button, Card, Checkbox, EditableCell, Select } from '@/components/ui';
import { DetailField, DetailList, RecordTimestamps, UNIT_OPTIONS, inlineEditClasses, medianUnitCost } from '@/components/catalogue';
import { formatCurrency } from '@/lib/utils';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Ingredient, SupplierIngredient, UpdateIngredientRequest } from '@/types';

interface IngredientDetailsProps {
  ingredient: Ingredient;
  links: SupplierIngredient[];
  onUpdate: (data: UpdateIngredientRequest) => void;
}

export function IngredientDetails({ ingredient, links, onUpdate }: IngredientDetailsProps) {
  const { data: categories = [] } = useCategories();
  const categorize = useCategorizeIngredient();
  const category = categories.find((c) => c.id === ingredient.category_id);

  const pricedLinks = links.filter((l) => l.pack_unit === ingredient.base_unit).length;
  const medianCost = medianUnitCost(links, ingredient.base_unit);

  const reassignCategory = async () => {
    try {
      const result = await categorize.mutateAsync(ingredient.name);
      if (!result.category_id) {
        toast.error('Could not determine a category');
        return;
      }
      onUpdate({ category_id: result.category_id });
      const name = categories.find((c) => c.id === result.category_id)?.name;
      toast.success(`Category set to ${name ? formatDisplayName(name) : 'the suggestion'}`);
    } catch {
      toast.error('Failed to reassign category');
    }
  };

  return (
    <Card className="flex flex-col gap-5">
      <DetailList>
        <DetailField label="Name" wide>
          <EditableCell
            value={ingredient.name}
            displayValue={formatDisplayName(ingredient.name)}
            onSave={(value) => value.trim() && onUpdate({ name: value.trim() })}
            className={inlineEditClasses}
          />
        </DetailField>
        <DetailField
          label="Unit cost"
          hint={pricedLinks > 0 ? `Median of ${pricedLinks} supplier${pricedLinks > 1 ? 's' : ''}` : undefined}
        >
          {pricedLinks > 0 ? (
            <span className="tabular-nums">
              {formatCurrency(medianCost)} / {ingredient.base_unit}
            </span>
          ) : (
            <EditableCell
              type="number"
              value={ingredient.cost_per_base_unit?.toString() ?? ''}
              displayValue={
                ingredient.cost_per_base_unit !== null
                  ? `${formatCurrency(ingredient.cost_per_base_unit)} / ${ingredient.base_unit}`
                  : ''
              }
              placeholder="Add unit cost"
              onSave={(value) => onUpdate({ cost_per_base_unit: value ? parseFloat(value) : null })}
              className={inlineEditClasses}
            />
          )}
        </DetailField>
        <DetailField label="Base unit">
          <Select
            aria-label="Base unit"
            value={ingredient.base_unit}
            options={UNIT_OPTIONS}
            onChange={(e) =>
              onUpdate({ base_unit: e.target.value, cost_per_base_unit: medianUnitCost(links, e.target.value) })
            }
            className="w-48"
          />
        </DetailField>
        <DetailField label="Category">
          <span className="flex flex-wrap items-center gap-2">
            <Badge>{category ? formatDisplayName(category.name) : 'Uncategorised'}</Badge>
            <Button variant="ghost" size="sm" onClick={reassignCategory} disabled={categorize.isPending}>
              <RefreshCw
                className={categorize.isPending ? 'size-4 animate-spin' : 'size-4'}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              {categorize.isPending ? 'Assigning…' : 'Reassign'}
            </Button>
          </span>
        </DetailField>
        <DetailField label="Dietary">
          <Checkbox
            checked={ingredient.is_halal}
            onChange={(e) => onUpdate({ is_halal: e.target.checked })}
            label="Halal"
          />
        </DetailField>
      </DetailList>
      <RecordTimestamps createdAt={ingredient.created_at} updatedAt={ingredient.updated_at} />
    </Card>
  );
}
