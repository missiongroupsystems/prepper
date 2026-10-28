'use client';

/**
 * One taster's note: who, the suggested status, the overall rating, then the feedback and the
 * suggested actions as labelled blocks, and the photos. The author can edit it in place or
 * delete it (with a confirm). Works for dish and ingredient notes alike.
 */
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge, Button, Card, ConfirmModal } from '@/components/ui';
import type { ImageWithId } from './ImageUploadPreview';
import { FeedbackForm } from './FeedbackForm';
import { NotePhotos } from './NotePhotos';
import { StarRating } from './StarRating';
import { DecisionBadge, type FeedbackFormValues, type FeedbackNote, type UseNoteImages } from './feedbackConfig';

interface FeedbackNoteCardProps<N extends FeedbackNote> {
  note: N;
  currentUserId: string | null;
  onUpdate: (note: N, values: FeedbackFormValues, images: ImageWithId[]) => Promise<void>;
  onDelete: (noteId: number) => Promise<void>;
  useNoteImages: UseNoteImages;
  showOwnerBadge?: boolean;
  actionsPlaceholder?: string;
}

function NoteBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[13px] font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm leading-relaxed whitespace-pre-line text-ink">{text}</dd>
    </div>
  );
}

export function FeedbackNoteCard<N extends FeedbackNote>({
  note,
  currentUserId,
  onUpdate,
  onDelete,
  useNoteImages,
  showOwnerBadge = false,
  actionsPlaceholder,
}: FeedbackNoteCardProps<N>) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: editFormImages = [] } = useNoteImages(isEditing ? note.id : null);
  const isAuthor = note.user_id !== null && note.user_id === currentUserId;

  const handleSave = async (values: FeedbackFormValues, images: ImageWithId[]) => {
    await onUpdate(note, values, images);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(note.id);
    } finally {
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <p className="text-base font-medium text-ink">{note.taster_name || 'Taster'}</p>
          {showOwnerBadge && isAuthor && <Badge variant="info" className="text-[13px]">You</Badge>}
          {note.decision && <DecisionBadge decision={note.decision} />}
        </div>
        {isAuthor && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={isEditing ? 'Stop editing feedback' : 'Edit feedback'}
              aria-pressed={isEditing}
              onClick={() => setIsEditing(!isEditing)}
            >
              <Pencil className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete feedback" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <FeedbackForm
          initialValues={{
            decision: note.decision || '',
            feedback: note.feedback || '',
            action_items: note.action_items || '',
            overall_rating: note.overall_rating,
          }}
          onSubmit={handleSave}
          onCancel={() => setIsEditing(false)}
          submitLabel="Update feedback"
          existingImages={editFormImages}
          actionsPlaceholder={actionsPlaceholder}
        />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-muted-foreground">Overall</span>
            <StarRating rating={note.overall_rating} />
            {note.overall_rating && (
              <span className="text-sm text-muted-foreground tabular-nums">{note.overall_rating}/5</span>
            )}
          </div>
          {(note.feedback || note.action_items) && (
            <dl className="flex flex-col gap-3">
              {note.feedback && <NoteBlock label="Feedback" text={note.feedback} />}
              {note.action_items && <NoteBlock label="Suggested actions" text={note.action_items} />}
            </dl>
          )}
          <NotePhotos noteId={note.id} useNoteImages={useNoteImages} />
        </>
      )}

      <ConfirmModal
        isOpen={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
        title="Delete feedback?"
        message="This removes the feedback and its photos from the tasting session."
        confirmLabel="Delete feedback"
        variant="destructive"
        pending={isDeleting}
      />
    </Card>
  );
}
