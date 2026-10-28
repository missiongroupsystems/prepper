'use client';

/**
 * Add, update and delete an ingredient's tasting notes in a session, syncing photos after the
 * note is written.
 */
import {
  useAddIngredientNote,
  useDeleteIngredientNote,
  useSyncIngredientTastingNoteImages,
  useUpdateIngredientNote,
} from '@/lib/hooks';
import { useAppState } from '@/lib/store';
import type { IngredientTastingNote } from '@/types';
import type { ImageWithId } from './ImageUploadPreview';
import type { FeedbackFormValues } from './feedbackConfig';

export function useIngredientFeedback(sessionId: number, ingredientId: number, currentUserId: string | null) {
  const { username } = useAppState();
  const addNote = useAddIngredientNote();
  const updateNote = useUpdateIngredientNote();
  const deleteNote = useDeleteIngredientNote();
  const syncImages = useSyncIngredientTastingNoteImages();

  const syncPhotos = async (noteId: number, images: ImageWithId[]) => {
    if (images.length === 0) return;
    try {
      await syncImages.mutateAsync({ ingredientTastingNoteId: noteId, images });
    } catch (imageError) {
      // The note itself is saved; a failed photo sync must not undo that.
      console.error('Failed to sync images:', imageError);
    }
  };

  const add = async (values: FeedbackFormValues, images: ImageWithId[]) => {
    const result = await addNote.mutateAsync({
      sessionId,
      data: {
        ingredient_id: ingredientId,
        taster_name: username || null,
        decision: values.decision || null,
        feedback: values.feedback || null,
        action_items: values.action_items || null,
        taste_rating: null,
        aroma_rating: null,
        texture_rating: null,
        overall_rating: values.overall_rating,
        user_id: currentUserId || undefined,
      },
    });
    if (result?.id) await syncPhotos(result.id, images);
  };

  const update = async (note: IngredientTastingNote, values: FeedbackFormValues, images: ImageWithId[]) => {
    await updateNote.mutateAsync({
      sessionId,
      noteId: note.id,
      data: {
        taster_name: note.taster_name || null,
        decision: values.decision || null,
        feedback: values.feedback || null,
        action_items: values.action_items || null,
        taste_rating: note.taste_rating,
        aroma_rating: note.aroma_rating,
        texture_rating: note.texture_rating,
        overall_rating: values.overall_rating,
      },
      ingredientId,
      userId: currentUserId,
    });
    await syncPhotos(note.id, images);
  };

  const remove = async (noteId: number) => {
    await deleteNote.mutateAsync({ sessionId, noteId, userId: currentUserId });
  };

  return { add, update, remove };
}
