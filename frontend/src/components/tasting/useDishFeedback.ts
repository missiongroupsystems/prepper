'use client';

/**
 * Add, update and delete a dish's tasting notes in a session, syncing photos after the note is
 * written. Shared by the inline per-dish panel and the dish tasting page.
 */
import {
  useAddNoteToSession,
  useDeleteTastingNote,
  useSyncTastingNoteImages,
  useUpdateTastingNote,
} from '@/lib/hooks/useTastings';
import { useAppState } from '@/lib/store';
import type { TastingNote } from '@/types';
import type { ImageWithId } from './ImageUploadPreview';
import type { FeedbackFormValues } from './feedbackConfig';

export function useDishFeedback(sessionId: number, recipeId: number, currentUserId: string | null) {
  const { username } = useAppState();
  const addNote = useAddNoteToSession();
  const updateNote = useUpdateTastingNote();
  const deleteNote = useDeleteTastingNote();
  const syncImages = useSyncTastingNoteImages();

  const syncPhotos = async (noteId: number, images: ImageWithId[]) => {
    if (images.length === 0) return;
    try {
      await syncImages.mutateAsync({ tastingNoteId: noteId, images });
    } catch (imageError) {
      // The note itself is saved; a failed photo sync must not undo that.
      console.error('Failed to sync images:', imageError);
    }
  };

  const add = async (values: FeedbackFormValues, images: ImageWithId[]) => {
    const result = await addNote.mutateAsync({
      sessionId,
      data: {
        recipe_id: recipeId,
        user_id: currentUserId || undefined,
        taster_name: username || null,
        decision: values.decision || null,
        feedback: values.feedback || null,
        action_items: values.action_items || null,
        taste_rating: null,
        presentation_rating: null,
        texture_rating: null,
        overall_rating: values.overall_rating,
      },
      userId: currentUserId,
    });
    if (result?.id) await syncPhotos(result.id, images);
  };

  const update = async (note: TastingNote, values: FeedbackFormValues, images: ImageWithId[]) => {
    await updateNote.mutateAsync({
      sessionId,
      noteId: note.id,
      data: {
        taster_name: note.taster_name || null,
        decision: values.decision || null,
        feedback: values.feedback || null,
        action_items: values.action_items || null,
        taste_rating: note.taste_rating,
        presentation_rating: note.presentation_rating,
        texture_rating: note.texture_rating,
        overall_rating: values.overall_rating,
      },
      userId: currentUserId,
    });
    await syncPhotos(note.id, images);
  };

  const remove = async (noteId: number) => {
    await deleteNote.mutateAsync({ sessionId, noteId, userId: currentUserId });
  };

  return { add, update, remove };
}
