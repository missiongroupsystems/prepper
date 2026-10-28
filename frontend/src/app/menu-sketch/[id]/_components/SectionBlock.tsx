'use client';

import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, X } from 'lucide-react';
import {
  useDeleteMenuSketchSection,
  useMenuSketchSectionItems,
  useUpdateMenuSketchSection,
  useUpdateMenuSketchSectionItem,
} from '@/lib/hooks';
import type { MenuSketchSection, MenuSketchSectionItemComment, Recipe } from '@/types';
import { Badge, ConfirmModal } from '@/components/ui';
import { cn } from '@/lib/utils';
import { AddDishInput } from './AddDishInput';
import { DishCard } from './DishCard';
import { DishRow, LIST_COLUMNS } from './DishRow';
import { inlineFieldClasses, quietIconClasses, unresolvedCount, type ViewMode } from './shared';
import { DragHandle, Sortable, useSortableOrder, type DragHandleProps } from './sortable';

/** One menu section: title row, its dishes (grid or list), then the add-dish field. */
export function SectionBlock({
  section,
  commentsByItemId,
  onOpenComments,
  viewMode,
  recipes,
  dragHandleProps,
  selectedItemIds,
  onToggleItem,
}: {
  section: MenuSketchSection;
  commentsByItemId: Record<number, MenuSketchSectionItemComment[]>;
  onOpenComments: (itemId: number, dishName: string) => void;
  viewMode: ViewMode;
  recipes: Recipe[];
  dragHandleProps?: DragHandleProps;
  selectedItemIds: Set<number>;
  onToggleItem: (itemId: number) => void;
}) {
  const { data: serverItems = [] } = useMenuSketchSectionItems(section.id);
  const updateSection = useUpdateMenuSketchSection();
  const deleteSection = useDeleteMenuSketchSection();
  const updateItem = useUpdateMenuSketchSectionItem();

  const [collapsed, setCollapsed] = useState(false);
  const [sectionName, setSectionName] = useState(section.name);
  const [confirmDeleteSection, setConfirmDeleteSection] = useState(false);

  const { ordered: orderedItems, sensors, onDragEnd } = useSortableOrder(serverItems, (item, orderNo) =>
    updateItem.mutate({ id: item.id, data: { order_no: orderNo }, prevRecipeId: item.recipe_id })
  );

  const sectionLabel = section.name || 'section';
  const bodyId = `menu-section-${section.id}`;
  const DishView = viewMode === 'card' ? DishCard : DishRow;

  return (
    <section aria-label={section.name || 'Unnamed section'} className="flex flex-col gap-4">
      <header className="-ml-2 flex items-center gap-1 hairline-b pb-2">
        <DragHandle handle={dragHandleProps} label={`Reorder ${sectionLabel}`} />
        <input
          type="text"
          aria-label="Section name"
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          onBlur={() => {
            if (sectionName.trim() !== section.name && sectionName.trim()) {
              updateSection.mutate({ id: section.id, data: { name: sectionName.trim() } });
            }
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          className={cn(inlineFieldClasses, 'mx-0 h-9 flex-1 text-lg font-medium')}
          placeholder="Section name"
        />
        <Badge className="tnum">
          {orderedItems.length} {orderedItems.length === 1 ? 'dish' : 'dishes'}
        </Badge>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          aria-label={collapsed ? `Expand ${sectionLabel}` : `Collapse ${sectionLabel}`}
          title={collapsed ? 'Expand section' : 'Collapse section'}
          className={quietIconClasses}
        >
          <ChevronDown
            className={cn('size-4 transition-transform duration-(--dur-base)', collapsed && '-rotate-90')}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          onClick={() => setConfirmDeleteSection(true)}
          aria-label={`Delete ${sectionLabel}`}
          title="Delete section"
          className={cn(quietIconClasses, 'hover:text-danger')}
        >
          <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      {!collapsed && (
        <div id={bodyId} className="@container flex flex-col gap-4">
          {viewMode === 'list' && orderedItems.length > 0 && (
            <div
              className={cn(LIST_COLUMNS, 'gap-x-3 px-3 text-xs font-medium text-muted-foreground max-sm:hidden')}
              aria-hidden="true"
            >
              <span />
              <span>Dish</span>
              <span>Key ingredients</span>
              <span className="text-right">Sale</span>
              <span className="text-right">Cost</span>
              <span className="pr-1 text-right">Food cost</span>
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={orderedItems.map((i) => i.id)}
              strategy={viewMode === 'card' ? rectSortingStrategy : verticalListSortingStrategy}
            >
              <div
                className={cn(
                  'grid',
                  // Two columns only when each card keeps ≥440px: 2 × 440 + 20 gap.
                  viewMode === 'card' ? 'gap-4 @min-[900px]:grid-cols-2 @min-[900px]:gap-5' : 'gap-3'
                )}
              >
                {orderedItems.map((item) => (
                  <Sortable key={item.id} id={item.id}>
                    {(handle) => (
                      <DishView
                        item={item}
                        unresolvedCount={unresolvedCount(commentsByItemId[item.id])}
                        onOpenComments={() => onOpenComments(item.id, item.recipe_name ?? '')}
                        recipes={recipes}
                        dragHandleProps={handle}
                        isSelected={selectedItemIds.has(item.id)}
                        onToggle={() => onToggleItem(item.id)}
                      />
                    )}
                  </Sortable>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <AddDishInput sectionId={section.id} nextOrderNo={orderedItems.length} recipes={recipes} />
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDeleteSection}
        onClose={() => setConfirmDeleteSection(false)}
        onConfirm={() => { deleteSection.mutate(section.id); setConfirmDeleteSection(false); }}
        title="Delete section"
        message={`Delete "${section.name || 'this section'}" and all its dishes?`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </section>
  );
}
