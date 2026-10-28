'use client';

/**
 * A dish on the session page: drag handle (creator only), whether you have reviewed it, its
 * name, the Feedback disclosure that opens the inline panel, and Remove (creator only).
 */
import { CheckCircle, ChevronDown, GripVertical, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import { cn } from '@/lib/utils';
import type { RecipeTasting } from '@/types';
import { DishFeedbackPanel } from './DishFeedbackPanel';

interface SortableDishItemProps {
  dish: RecipeTasting;
  isCreator: boolean;
  isReviewed: boolean;
  onRemove: () => void;
  sessionId: number;
  currentUserId: string | null;
  isParticipant: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SortableDishItem({
  dish,
  isCreator,
  isReviewed,
  onRemove,
  sessionId,
  currentUserId,
  isParticipant,
  isExpanded,
  onToggle,
}: SortableDishItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dish.id });
  const name = dish.recipe_name ? formatDisplayName(dish.recipe_name) : `Dish #${dish.recipe_id}`;
  const panelId = `dish-feedback-${dish.id}`;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="rounded-lg bg-card hairline"
    >
      <div className="flex items-center gap-2 py-2 pr-2 pl-3">
        {isCreator && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${name}`}
            className="-ml-1 flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-tertiary hover:bg-surface-hover hover:text-ink active:cursor-grabbing max-sm:size-11"
          >
            <GripVertical className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {isReviewed ? (
            <CheckCircle className="size-5 shrink-0 text-success" strokeWidth={1.5} aria-label="You reviewed this" />
          ) : (
            <span className="size-5 shrink-0 rounded-full border-[1.5px] border-line" aria-label="Not reviewed by you" role="img" />
          )}
          <span className="line-clamp-2 min-w-0 text-[15px] font-medium text-ink">{name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className="shrink-0"
        >
          <span className="max-sm:sr-only">Feedback</span>
          <ChevronDown className={cn('size-4 transition-transform', isExpanded && 'rotate-180')} strokeWidth={1.5} aria-hidden="true" />
        </Button>
        {isCreator && (
          <Button variant="ghost" size="icon" onClick={onRemove} aria-label={`Remove ${name} from session`} className="shrink-0">
            <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </Button>
        )}
      </div>
      {isExpanded && (
        <div id={panelId}>
          <DishFeedbackPanel
            recipeId={dish.recipe_id}
            sessionId={sessionId}
            currentUserId={currentUserId}
            isParticipant={isParticipant}
          />
        </div>
      )}
    </li>
  );
}
