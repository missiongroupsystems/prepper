'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ChevronDown, GripVertical, ImagePlus } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import type { SupplierIngredient } from '@/types';
import { itemLabel, supplierUnitCost } from './canvasModel';
import {
  DisplayName,
  LineCost,
  QuantityStepper,
  RowActions,
  SupplierSelect,
  UnitSelect,
  WastageInput,
} from './StagedControls';
import type { StagedIngredient } from './types';

/** The card frame both staged cards share: hairline, no shadow, lifted while expanded. */
export const stagedCardClasses = 'overflow-hidden rounded-lg bg-card hairline transition-colors hover:border-input';

export function StagedIngredientCard({
  staged,
  suppliers,
  categoryMap,
  onRemove,
  onQuantityChange,
  onWastageChange,
  onUnitChange,
  onSupplierSelect,
}: {
  staged: StagedIngredient;
  suppliers: SupplierIngredient[];
  categoryMap: Record<number, string>;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
  onWastageChange: (wastage: number) => void;
  onUnitChange: (unit: string) => void;
  onSupplierSelect: (supplierId: number | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `staged-ingredient-${staged.id}`,
    data: { type: 'staged-ingredient', stagedId: staged.id },
  });
  const name = itemLabel(staged.ingredient.name);
  const categoryName = staged.ingredient.category_id ? categoryMap[staged.ingredient.category_id] : null;

  return (
    <div
      ref={setNodeRef}
      // dnd-kit's live drag offset — the one thing a utility cannot say.
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isExpanded ? 10 : 1,
      }}
      className={stagedCardClasses}
    >
      <div className="flex h-20 items-center justify-center bg-muted">
        <ImagePlus className="size-7 text-placeholder" strokeWidth={1.5} aria-hidden="true" />
      </div>

      <div className="flex items-start gap-1.5 px-3 pt-3">
        <button
          {...listeners}
          {...attributes}
          aria-label={`Drag ${name}`}
          className="mt-0.5 cursor-grab touch-none text-tertiary hover:text-ink"
        >
          <GripVertical className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <DisplayName name={staged.ingredient.name} className="text-sm font-medium text-ink" />
          <span className="text-xs text-tertiary">Ingredient</span>
        </div>
        <RowActions itemName={name} onRemove={onRemove} />
      </div>

      <div className="space-y-3 p-3">
        {categoryName && <Badge>{categoryName}</Badge>}

        <div className="flex items-center gap-2">
          <QuantityStepper value={staged.quantity} onChange={onQuantityChange} itemName={name} />
          <UnitSelect unit={staged.unit} onChange={onUnitChange} itemName={name} className="w-auto min-w-0 flex-1" />
        </div>

        <div className="flex items-center justify-between gap-2">
          <LineCost quantity={staged.quantity} unitPrice={staged.unitPrice} unit={staged.unit} />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? `Hide details for ${name}` : `Show details for ${name}`}
            aria-expanded={isExpanded}
          >
            <ChevronDown
              className={isExpanded ? 'size-4 rotate-180 transition-transform' : 'size-4 transition-transform'}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </Button>
        </div>

        {suppliers.length > 0 && (
          <SupplierSelect
            supplierId={staged.selectedSupplierId}
            suppliers={suppliers}
            onChange={onSupplierSelect}
            itemName={name}
          />
        )}

        {isExpanded && (
          <dl className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Unit cost</dt>
              <dd className="font-medium tabular-nums text-ink">
                {staged.unitPrice != null ? `$${staged.unitPrice.toFixed(2)}/${staged.unit}` : 'N/A'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Wastage</dt>
              <dd>
                <WastageInput value={staged.wastage_percentage} onChange={onWastageChange} itemName={name} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Suppliers</dt>
              <dd>
                {suppliers.length > 0 ? (
                  <ul className="mt-1 space-y-1.5">
                    {suppliers.map((supplier) => (
                      <li key={supplier.supplier_id} className="flex items-center justify-between gap-2 text-ink">
                        <span className={supplier.is_preferred ? 'font-medium' : undefined}>
                          {formatDisplayName(supplier.supplier_name ?? '')}
                          {supplier.is_preferred && <Badge className="ml-1">Preferred</Badge>}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {supplier.pack_size > 0 ? `$${supplierUnitCost(supplier).toFixed(2)}` : '$N/A'}/{supplier.pack_unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-tertiary">No suppliers</p>
                )}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
