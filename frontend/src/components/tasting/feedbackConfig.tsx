/**
 * What dish and ingredient tasting notes share: the decision vocabulary and its badge, and the
 * note and form shapes the shared feedback components work on.
 */
import { AlertCircle, CheckCircle, XCircle, type LucideIcon } from 'lucide-react';
import { Badge, type SemanticVariant } from '@/components/ui';
import type { TastingDecision, TastingNote, TastingNoteImage } from '@/types';

export const DECISION_CONFIG: Record<TastingDecision, { label: string; icon: LucideIcon; badgeVariant: SemanticVariant }> = {
  approved: { label: 'Approved', icon: CheckCircle, badgeVariant: 'success' },
  needs_work: { label: 'Needs work', icon: AlertCircle, badgeVariant: 'warning' },
  rejected: { label: 'Rejected', icon: XCircle, badgeVariant: 'danger' },
};

export const DECISION_OPTIONS = [
  { value: '', label: 'No suggestion' },
  ...(Object.keys(DECISION_CONFIG) as TastingDecision[]).map((value) => ({ value, label: DECISION_CONFIG[value].label })),
];

export function DecisionBadge({ decision }: { decision: TastingDecision }) {
  const { label, icon: Icon, badgeVariant } = DECISION_CONFIG[decision];
  return (
    <Badge variant={badgeVariant} className="gap-1 text-[13px]">
      <Icon className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
      {label}
    </Badge>
  );
}

/** The fields a dish note and an ingredient note have in common. */
export type FeedbackNote = Pick<
  TastingNote,
  'id' | 'taster_name' | 'decision' | 'feedback' | 'action_items' | 'overall_rating' | 'user_id'
>;

/** What the feedback form edits; other ratings pass through untouched. */
export interface FeedbackFormValues {
  decision: TastingDecision | '';
  feedback: string;
  action_items: string;
  overall_rating: number | null;
}

export type NoteImage = Pick<TastingNoteImage, 'id' | 'image_url'>;

/** A note's photos query — `useTastingNoteImages` or `useIngredientTastingNoteImages`. */
export type UseNoteImages = (noteId: number | null) => { data?: NoteImage[]; isLoading: boolean };
