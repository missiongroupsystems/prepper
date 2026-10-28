'use client';

/**
 * Tasting history on the Overview: the AI feedback summary (generated on demand and saved to the
 * recipe), then every tasting note behind a disclosure.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle, ChevronDown, Star, Wand2, Wine, XCircle } from 'lucide-react';
import { useUpdateRecipe } from '@/lib/hooks';
import { useRecipeTastingNotes, useRecipeTastingSummary } from '@/lib/hooks/useTastings';
import { useSummarizeFeedback } from '@/lib/hooks/useAgents';
import { Badge, Button, buttonClasses, EmptyState, PendingButton, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Recipe, TastingDecision } from '@/types';
import { OverviewSection } from './OverviewSection';

const MAX_RATING = 5;
const SUMMARY_SKELETON_WIDTHS = ['w-full', 'w-5/6', 'w-4/6'];

const DECISIONS: Record<TastingDecision, { label: string; icon: typeof CheckCircle; variant: 'success' | 'warning' | 'danger' }> = {
  approved: { label: 'Approved', icon: CheckCircle, variant: 'success' },
  needs_work: { label: 'Needs work', icon: AlertCircle, variant: 'warning' },
  rejected: { label: 'Rejected', icon: XCircle, variant: 'danger' },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of ${MAX_RATING}`}>
      {Array.from({ length: MAX_RATING }, (_, i) => (
        <Star
          key={i}
          strokeWidth={1.5}
          aria-hidden="true"
          className={cn('size-3.5', i < rating ? 'fill-accent text-accent' : 'text-placeholder')}
        />
      ))}
    </span>
  );
}

function formatTastingDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function OverviewTasting({ recipe, canSummarize }: { recipe: Recipe; canSummarize: boolean }) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const summaryForRecipeId = useRef<number | null>(null);
  const { data: notes = [] } = useRecipeTastingNotes(recipe.id);
  const { data: summary } = useRecipeTastingSummary(recipe.id);
  const { mutate: updateRecipe } = useUpdateRecipe();
  const { mutate: summarize, data: generated, isPending: isSummarizing, error: summarizeError } = useSummarizeFeedback();

  // Save a generated summary to the recipe — unless the user moved to another recipe mid-call.
  useEffect(() => {
    if (!generated?.success || !generated.summary || summaryForRecipeId.current !== recipe.id) return;
    updateRecipe({ id: recipe.id, data: { summary_feedback: generated.summary } });
  }, [generated?.success, generated?.summary, recipe.id, updateRecipe]);

  if (!summary || summary.total_tastings === 0 || notes.length === 0) {
    return (
      <OverviewSection title="Tasting history">
        <EmptyState
          bare
          icon={Wine}
          title="No tastings yet"
          action={
            <Link href="/tastings/new" className={buttonClasses('secondary', 'sm')}>
              New tasting session
            </Link>
          }
        />
      </OverviewSection>
    );
  }

  const generate = () => {
    summaryForRecipeId.current = recipe.id;
    summarize(recipe.id);
  };

  return (
    <OverviewSection title="Tasting history">
      <div className="flex flex-col gap-3 rounded-lg bg-surface-sunken p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink">Feedback summary</p>
          {canSummarize && (
            <PendingButton variant="secondary" size="sm" onClick={generate} pending={isSummarizing}>
              <Wand2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
              {recipe.summary_feedback ? 'Regenerate' : 'Generate'}
            </PendingButton>
          )}
        </div>
        {isSummarizing ? (
          SUMMARY_SKELETON_WIDTHS.map((width) => <Skeleton key={width} className={cn('h-4', width)} />)
        ) : summarizeError ? (
          <p className="text-sm text-danger">The summary could not be generated. Try again.</p>
        ) : (
          <p className={cn('text-sm leading-relaxed', recipe.summary_feedback ? 'text-ink' : 'text-tertiary')}>
            {recipe.summary_feedback || 'No summary yet'}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        onClick={() => setIsNotesOpen((open) => !open)}
        aria-expanded={isNotesOpen}
        className="justify-between rounded-lg px-3"
      >
        <span>Tasting notes ({notes.length})</span>
        <ChevronDown
          strokeWidth={1.5}
          aria-hidden="true"
          className={cn('size-4 text-muted-foreground transition-transform', isNotesOpen && 'rotate-180')}
        />
      </Button>

      {isNotesOpen && (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => {
            const decision = note.decision ? DECISIONS[note.decision] : null;
            const Icon = decision?.icon;
            return (
              <li key={note.id} className="flex flex-col gap-1.5 rounded-lg bg-surface-sunken p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/tastings/${note.session_id}`} className="text-sm font-medium text-ink hover:text-accent">
                    {note.session_name}
                  </Link>
                  {decision && Icon && (
                    <Badge variant={decision.variant} className="gap-1">
                      <Icon className="size-3" strokeWidth={1.5} aria-hidden="true" />
                      {decision.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm tabular-nums text-muted-foreground">
                  {note.session_date && <span>{formatTastingDate(note.session_date)}</span>}
                  {note.overall_rating && <StarRating rating={note.overall_rating} />}
                </div>
                {note.feedback && <p className="text-sm text-muted-foreground">&ldquo;{note.feedback}&rdquo;</p>}
              </li>
            );
          })}
        </ul>
      )}
    </OverviewSection>
  );
}
