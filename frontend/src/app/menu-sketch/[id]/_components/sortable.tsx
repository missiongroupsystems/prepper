'use client';

import { useRef, useState, type ReactNode } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { quietIconClasses } from './shared';

/** dnd-kit's sortable `attributes` + `listeners`, spread onto the handle. */
export type DragHandleProps = Record<string, unknown>;

const DRAG_ACTIVATION_DISTANCE = 5;

/**
 * Local order for a server list that can be drag-reordered. New or removed ids reset the order
 * to the server's; a drop reorders locally and persists every row whose `order_no` changed.
 */
export function useSortableOrder<T extends { id: number; order_no: number }>(
  serverItems: T[],
  persist: (item: T, orderNo: number) => void
) {
  const [order, setOrder] = useState<number[]>([]);

  const prevItemsRef = useRef<T[]>([]);
  if (prevItemsRef.current !== serverItems) {
    const newIds = serverItems.map((i) => i.id);
    const added = newIds.filter((id) => !order.includes(id));
    const removed = order.filter((id) => !newIds.includes(id));
    if (added.length > 0 || removed.length > 0) {
      setOrder(newIds);
    }
    prevItemsRef.current = serverItems;
  }

  const ordered = order
    .map((id) => serverItems.find((i) => i.id === id))
    .filter((i): i is T => i != null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((i) => i.id === active.id);
    const newIndex = ordered.findIndex((i) => i.id === over.id);
    const newOrder = arrayMove(ordered, oldIndex, newIndex);
    setOrder(newOrder.map((i) => i.id));
    newOrder.forEach((item, idx) => {
      if (item.order_no !== idx) persist(item, idx);
    });
  };

  return { ordered, sensors, onDragEnd };
}

/** A sortable wrapper that hands its drag-handle props to the child. */
export function Sortable({ id, children }: { id: number; children: (handle: DragHandleProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

export function DragHandle({
  handle,
  label,
  className,
}: {
  handle?: DragHandleProps;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(quietIconClasses, 'cursor-grab touch-none active:cursor-grabbing', className)}
      {...handle}
    >
      <GripVertical className="size-4" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
