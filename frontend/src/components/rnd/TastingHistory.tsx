/**
 * Every tasting of the dish: the session, its date, the overall rating, the suggested status and
 * the start of the feedback.
 */
import Link from 'next/link';
import { Wine } from 'lucide-react';
import { EmptyState, buttonClasses } from '@/components/ui';
import { DecisionBadge } from '@/components/tasting/feedbackConfig';
import { StarRating } from '@/components/tasting/StarRating';
import type { RecipeTastingSummary, TastingNoteWithRecipe } from '@/types';
import { CollapsibleSection } from './CollapsibleSection';
import { formatTastingDate } from './tastingDate';

interface TastingHistoryProps {
  tastingNotes: TastingNoteWithRecipe[] | undefined;
  tastingSummary: RecipeTastingSummary | undefined;
}

function historySummary(summary: RecipeTastingSummary | undefined) {
  if (!summary || summary.total_tastings === 0) return undefined;
  const count = `${summary.total_tastings} tasting${summary.total_tastings !== 1 ? 's' : ''}`;
  return summary.average_overall_rating ? `${count} · ${summary.average_overall_rating.toFixed(1)} average` : count;
}

export function TastingHistory({ tastingNotes, tastingSummary }: TastingHistoryProps) {
  return (
    <CollapsibleSection icon={Wine} title="Tasting history" summary={historySummary(tastingSummary)}>
      {tastingNotes && tastingNotes.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {tastingNotes.map((note) => (
            <li key={note.id} className="flex flex-col gap-1.5 rounded-md bg-surface-sunken p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/tastings/${note.session_id}`} className="text-sm font-medium text-ink hover:underline">
                  {note.session_name}
                </Link>
                {note.decision && <DecisionBadge decision={note.decision} />}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {note.session_date && <span>{formatTastingDate(note.session_date)}</span>}
                {note.overall_rating ? <StarRating rating={note.overall_rating} size="sm" /> : null}
              </div>
              {note.feedback && (
                <p className="line-clamp-2 text-sm text-muted-foreground">&ldquo;{note.feedback}&rdquo;</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          bare
          icon={Wine}
          title="No tastings recorded yet"
          className="py-6"
          action={
            <Link href="/tastings/new" className={buttonClasses('secondary', 'sm')}>
              Create tasting session
            </Link>
          }
        />
      )}
    </CollapsibleSection>
  );
}
