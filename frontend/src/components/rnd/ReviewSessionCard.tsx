'use client';

/**
 * A tasting session in the R&D "Review" column. It only renders when the session holds a dish
 * whose parent is ready for review.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users } from 'lucide-react';
import { useSessionRecipes } from '@/lib/hooks/useTastings';
import { Card } from '@/components/ui';
import type { TastingSession } from '@/types';

interface ReviewSessionCardProps {
  session: TastingSession;
  readyForReviewRecipeIds: Set<number>;
}

export function ReviewSessionCard({ session, readyForReviewRecipeIds }: ReviewSessionCardProps) {
  const { data: sessionRecipes } = useSessionRecipes(session.id);

  const hasReadyForReviewRecipes = useMemo(
    () => (sessionRecipes ?? []).some((rt) => readyForReviewRecipeIds.has(rt.recipe_id)),
    [sessionRecipes, readyForReviewRecipeIds]
  );
  if (!hasReadyForReviewRecipes) return null;

  const attendees = session.participants?.length ?? 0;
  const formattedDate = new Date(session.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={`/tastings/${session.id}`} className="block rounded-lg">
      <Card interactive className="flex flex-col gap-2">
        <p className="text-base font-medium text-ink">{session.name}</p>
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Calendar className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {formattedDate}
          </li>
          {session.location && (
            <li className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span className="truncate">{session.location}</span>
            </li>
          )}
          <li className="flex items-center gap-1.5 tabular-nums">
            <Users className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {attendees} attendee{attendees !== 1 ? 's' : ''}
          </li>
        </ul>
      </Card>
    </Link>
  );
}
