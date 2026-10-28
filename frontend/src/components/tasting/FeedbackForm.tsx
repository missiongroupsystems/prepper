'use client';

/**
 * The tasting feedback form, for adding a note and for editing your own: overall rating, photos,
 * feedback, suggested actions and a suggested status. Every field is labelled.
 */
import { useId, useState } from 'react';
import { Button, Label, PendingButton, Select, Textarea } from '@/components/ui';
import type { TastingDecision } from '@/types';
import { ImageUploadPreview, type ImageWithId } from './ImageUploadPreview';
import { StarRating } from './StarRating';
import { DECISION_OPTIONS, type FeedbackFormValues, type NoteImage } from './feedbackConfig';

interface FeedbackFormProps {
  initialValues?: Partial<FeedbackFormValues>;
  onSubmit: (values: FeedbackFormValues, images: ImageWithId[]) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  existingImages?: NoteImage[];
  actionsPlaceholder?: string;
}

export function FeedbackForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  existingImages = [],
  actionsPlaceholder = 'What needs to change…',
}: FeedbackFormProps) {
  const id = useId();
  const [decision, setDecision] = useState<TastingDecision | ''>(initialValues?.decision || '');
  const [feedback, setFeedback] = useState(initialValues?.feedback || '');
  const [actionItems, setActionItems] = useState(initialValues?.action_items || '');
  const [overallRating, setOverallRating] = useState<number | null>(initialValues?.overall_rating ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ImageWithId[]>([]);

  const resetForm = () => {
    setDecision(initialValues?.decision || '');
    setFeedback(initialValues?.feedback || '');
    setActionItems(initialValues?.action_items || '');
    setOverallRating(initialValues?.overall_rating ?? null);
    setSelectedImages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(
        { decision, feedback: feedback.trim(), action_items: actionItems.trim(), overall_rating: overallRating },
        selectedImages
      );
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <p id={`${id}-rating`} className="text-[13px] font-medium text-muted-foreground">
          Overall rating
        </p>
        <StarRating rating={overallRating} onChange={setOverallRating} label="Overall rating" />
      </div>

      <ImageUploadPreview onImagesSelected={setSelectedImages} uploadedImages={existingImages} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-feedback`}>Feedback</Label>
        <Textarea
          id={`${id}-feedback`}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tasting notes and observations…"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-actions`}>Suggested actions</Label>
        <Textarea
          id={`${id}-actions`}
          value={actionItems}
          onChange={(e) => setActionItems(e.target.value)}
          placeholder={actionsPlaceholder}
          rows={2}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-decision`}>Suggested status</Label>
        <Select
          id={`${id}-decision`}
          value={decision}
          onChange={(e) => setDecision(e.target.value as TastingDecision | '')}
          options={DECISION_OPTIONS}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PendingButton type="submit" pending={isSubmitting}>
          {submitLabel}
        </PendingButton>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
