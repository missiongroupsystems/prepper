'use client';

/** A menu section: its name (edited in place), its sortable item rows and its actions. */
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreHorizontal, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { Button, Card, EmptyState, Input, Menu, MenuItem } from '@/components/ui';
import type { DraftItem, DraftSection } from './menuDraft';
import { MenuItemRow } from './MenuItemRow';
import { DragHandle, Sortable, useSortableSensors, type HandleProps } from './Sortable';

export function MenuSectionCard({
  section,
  handle,
  onRename,
  onRemove,
  onAddDishes,
  onEditItem,
  onRemoveItem,
  onMoveItem,
}: {
  section: DraftSection;
  handle: HandleProps;
  onRename: (name: string) => void;
  onRemove: () => void;
  onAddDishes: () => void;
  onEditItem: (item: DraftItem) => void;
  onRemoveItem: (item: DraftItem) => void;
  onMoveItem: (activeKey: string, overKey: string) => void;
}) {
  const label = section.name || 'Untitled section';
  const sensors = useSortableSensors();
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onMoveItem(String(active.id), String(over.id));
  };
  return (
    <Card role="region" aria-label={label} className="flex flex-col p-0">
      <div className="flex items-center gap-2 border-b border-line px-3 py-3">
        <DragHandle label={`Reorder ${label}`} {...handle} />
        <Input
          aria-label="Section name"
          value={section.name}
          onChange={(e) => onRename(e.target.value)}
          placeholder="Section name"
          className="flex-1 font-medium"
        />
        <Menu
          label={`${label} actions`}
          trigger={(props) => (
            <Button variant="ghost" size="icon-sm" aria-label={`${label} actions`} {...props}>
              <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </Button>
          )}
        >
          <MenuItem icon={Plus} onSelect={onAddDishes}>
            Add dishes
          </MenuItem>
          <MenuItem icon={Trash2} danger onSelect={onRemove}>
            Remove section
          </MenuItem>
        </Menu>
      </div>

      {section.items.length === 0 ? (
        <EmptyState
          bare
          icon={UtensilsCrossed}
          title="No dishes in this section"
          action={
            <Button variant="secondary" size="sm" onClick={onAddDishes}>
              <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
              Add dishes
            </Button>
          }
        />
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={section.items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col divide-y divide-line px-2">
                {section.items.map((item) => (
                  <Sortable key={item.key} id={item.key}>
                    {(itemHandle) => (
                      <MenuItemRow
                        item={item}
                        handle={itemHandle}
                        onEdit={() => onEditItem(item)}
                        onRemove={() => onRemoveItem(item)}
                      />
                    )}
                  </Sortable>
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <div className="border-t border-line px-3 py-2">
            <Button variant="ghost" size="sm" onClick={onAddDishes}>
              <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
              Add dishes
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
