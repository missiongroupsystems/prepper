'use client';

/**
 * The inline feedback panel under a dish on the session page: everyone's notes on the dish, and
 * for participants an "Add feedback" disclosure with the form.
 */
import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSessionNotes, useTastingNoteImages } from '@/lib/hooks/useTastings';
import { cn } from '@/lib/utils';
import { FeedbackForm } from './FeedbackForm';
import { FeedbackNoteCard } from './FeedbackNoteCard';
import { useDishFeedback } from './useDishFeedback';
import type { FeedbackFormValues } from './feedbackConfig';
import type { ImageWithId } from './ImageUploadPreview';

interface Props {
  recipeId: number;
  sessionId: number;
  currentUserId: string | null;
  isParticipant: boolean;
}

export function DishFeedbackPanel({ recipeId, sessionId, currentUserId, isParticipant }: Props) {
  const { data: allNotes } = useSessionNotes(sessionId);
  const { add, update, remove } = useDishFeedback(sessionId, recipeId, currentUserId);
  const [showAddForm, setShowAddForm] = useState(false);
  const formId = useId();

  const recipeNotes = (allNotes ?? []).filter((n) => n.recipe_id === recipeId);

  const handleAdd = async (values: FeedbackFormValues, images: ImageWithId[]) => {
    await add(values, images);
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 pt-4 pb-4">
      {recipeNotes.length === 0 && !showAddForm ? (
        <p className="rounded-md border border-dashed border-line py-6 text-center text-sm text-muted-foreground">
          No feedback recorded yet
        </p>
      ) : (
        recipeNotes.map((note) => (
          <FeedbackNoteCard
            key={note.id}
            note={note}
            currentUserId={currentUserId}
            onUpdate={update}
            onDelete={remove}
            useNoteImages={useTastingNoteImages}
            showOwnerBadge
          />
        ))
      )}

      {isParticipant && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            aria-expanded={showAddForm}
            aria-controls={formId}
            className="-ml-1 flex min-h-9 items-center gap-1.5 self-start rounded-md px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-ink max-sm:min-h-11"
          >
            <ChevronDown
              className={cn('size-4 transition-transform', showAddForm && 'rotate-180')}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            Add feedback
          </button>
          {showAddForm && (
            <div id={formId} className="rounded-lg bg-surface-sunken p-4">
              <FeedbackForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} submitLabel="Add feedback" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
