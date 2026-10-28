'use client';

/**
 * The feedback half of a dish or ingredient tasting page: a heading with the count, "Add
 * feedback" for participants (opening the form above the list), then the notes or an empty state.
 */
import { useState, type ReactNode } from 'react';
import { MessageSquareText, Plus } from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import type { ImageWithId } from './ImageUploadPreview';
import { FeedbackForm } from './FeedbackForm';
import type { FeedbackFormValues } from './feedbackConfig';

interface FeedbackSectionProps {
  count: number;
  canAdd: boolean;
  onAdd: (values: FeedbackFormValues, images: ImageWithId[]) => Promise<void>;
  actionsPlaceholder?: string;
  children: ReactNode;
}

export function FeedbackSection({ count, canAdd, onAdd, actionsPlaceholder, children }: FeedbackSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = async (values: FeedbackFormValues, images: ImageWithId[]) => {
    await onAdd(values, images);
    setShowAddForm(false);
  };

  return (
    <section aria-labelledby="feedback-heading" className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="feedback-heading" className="flex items-center gap-2 text-lg font-medium text-ink">
          Feedback
          <Badge className="text-[13px] tabular-nums">{count}</Badge>
        </h2>
        {!showAddForm && canAdd && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Add feedback
          </Button>
        )}
      </header>

      {showAddForm && (
        <Card sunken>
          <FeedbackForm
            onSubmit={handleAdd}
            onCancel={() => setShowAddForm(false)}
            submitLabel="Add feedback"
            actionsPlaceholder={actionsPlaceholder}
          />
        </Card>
      )}

      {count === 0 && !showAddForm ? (
        <EmptyState
          icon={MessageSquareText}
          title="No feedback recorded yet"
          description={canAdd ? 'Add feedback to record your tasting notes.' : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">{children}</div>
      )}
    </section>
  );
}
