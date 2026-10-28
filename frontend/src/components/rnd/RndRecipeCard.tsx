'use client';

/**
 * A dish in the R&D "To do" column: name, yield, status, cost per portion, a Fork action that
 * starts R&D on it, and the AI feedback summary as a disclosure under the card body.
 */
import { useId, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, GitFork, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Spinner } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import { cn } from '@/lib/utils';
import type { Recipe } from '@/types';
import { PortionCost, RecipeStatusBadge, RecipeThumb } from './recipeDisplay';
import { useFeedbackSummary } from './useFeedbackSummary';

interface RndRecipeCardProps {
  recipe: Recipe;
  isOwned: boolean;
  onFork: () => void;
  isForking: boolean;
}

export function RndRecipeCard({ recipe, isOwned, onFork, isForking }: RndRecipeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const summaryId = useId();
  const { generate, isPending } = useFeedbackSummary(recipe.id);
  const summary = recipe.summary_feedback;
  const costPerPortion =
    recipe.cost_price != null && recipe.yield_quantity > 0 ? recipe.cost_price / recipe.yield_quantity : recipe.cost_price;

  const handleToggle = async () => {
    if (summary) {
      setIsExpanded(!isExpanded);
      return;
    }
    if (await generate('Failed to generate feedback summary')) {
      setIsExpanded(true);
      toast.success('Feedback summary generated successfully');
    }
  };

  const handleRegenerate = async () => {
    if (await generate('Failed to regenerate feedback summary')) {
      toast.success('Feedback summary regenerated successfully');
      setIsExpanded(false);
    }
  };

  return (
    <Card className="relative flex flex-col gap-3 p-0">
      <div className="flex items-start gap-3 px-5 pt-5">
        <div className="min-w-0 flex-1">
          {/* Stretched link: the whole card body opens the dish; Fork sits above it. */}
          <Link
            href={`/rnd/r/${recipe.id}`}
            className="text-base font-medium text-ink after:absolute after:inset-0 after:rounded-lg hover:underline"
          >
            {formatDisplayName(recipe.name)}
          </Link>
          <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
            {recipe.yield_quantity} {recipe.yield_unit}
          </p>
        </div>
        <RecipeThumb recipe={recipe} />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5">
        <RecipeStatusBadge status={recipe.status} />
        {isOwned && <Badge variant="info" className="text-[13px]">Yours</Badge>}
      </div>

      <div className="flex items-center justify-between gap-3 px-5">
        <PortionCost value={costPerPortion} />
        <Button variant="secondary" size="sm" onClick={onFork} loading={isForking} className="relative z-10">
          <GitFork className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Fork
        </Button>
      </div>

      <div className="relative z-10 border-t border-line">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-expanded={isExpanded && !!summary}
          aria-controls={summaryId}
          className="flex min-h-11 w-full items-center justify-between rounded-b-lg px-5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-60"
        >
          Feedback summary
          {isPending ? (
            <Spinner className="size-4" />
          ) : (
            <ChevronDown
              className={cn('size-4 transition-transform', isExpanded && summary && 'rotate-180')}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}
        </button>

        {isExpanded && (
          <div id={summaryId} className="flex flex-col gap-3 px-5 pb-5 text-sm text-muted-foreground">
            {summary ? (
              <>
                <p className="leading-relaxed text-ink">{summary}</p>
                <Button variant="secondary" size="sm" onClick={handleRegenerate} disabled={isPending} className="self-start">
                  <RotateCcw className={cn('size-4', isPending && 'animate-spin')} strokeWidth={1.5} aria-hidden="true" />
                  {isPending ? 'Generating…' : 'Regenerate summary'}
                </Button>
              </>
            ) : (
              <p>{isPending ? 'Generating summary…' : 'No summary available'}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
