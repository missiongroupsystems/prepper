'use client';

/**
 * dnd-kit pieces for the builder: pointer + keyboard sensors, a sortable wrapper whose child
 * receives the drag handle's props, and the handle. Sections and each section's items sort in
 * separate (nested) DndContexts, so a dragged section never targets its own rows.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HandleProps = HTMLAttributes<HTMLButtonElement>;

export function useSortableSensors() {
  return useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}

export function Sortable({ id, children }: { id: string; children: (handle: HandleProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      // dnd-kit's live transform — computed per frame, so it can't be a utility class.
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10 opacity-60')}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

export function DragHandle({ label, ...props }: HandleProps & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-tertiary max-sm:size-11',
        'hover:bg-surface-hover hover:text-ink active:cursor-grabbing',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
      )}
      {...props}
    >
      <GripVertical className="size-4" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
