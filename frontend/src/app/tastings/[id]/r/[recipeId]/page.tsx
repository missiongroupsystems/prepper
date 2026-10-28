'use client';

import { useParams } from 'next/navigation';
import { useAppState } from '@/lib/store';
import { useTastingSession, useSessionNotes, useTastingNoteImages } from '@/lib/hooks/useTastings';
import { useRecipeForTasting, useRecipeAllergens } from '@/lib/hooks';
import { Page, SectionHeader } from '@/components/app';
import { Badge } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import { FeedbackNoteCard } from '@/components/tasting/FeedbackNoteCard';
import { FeedbackSection } from '@/components/tasting/FeedbackSection';
import { Fact, SessionFacts } from '@/components/tasting/SessionFacts';
import { BackLink, TastingNotFound, TastingPageSkeleton } from '@/components/tasting/TastingPageStates';
import { useDishFeedback } from '@/components/tasting/useDishFeedback';

export default function RecipeTastingPage() {
  const params = useParams();
  const sessionId = params.id ? Number(params.id) : null;
  const recipeId = params.recipeId ? Number(params.recipeId) : null;

  const { userId } = useAppState();

  const { data: session, isLoading: sessionLoading } = useTastingSession(sessionId);
  const isInvited = userId && session?.participants?.some((p) => p.user_id === userId) === true;
  const { data: recipe, isLoading: recipeLoading } = useRecipeForTasting(recipeId);
  const { data: allergens = [] } = useRecipeAllergens(recipeId);
  const { data: allNotes } = useSessionNotes(sessionId);
  const { add, update, remove } = useDishFeedback(sessionId ?? 0, recipeId ?? 0, userId);

  const recipeNotes = allNotes?.filter((n) => n.recipe_id === recipeId) || [];
  const sessionHref = `/tastings/${sessionId}`;

  if (sessionLoading || recipeLoading) return <TastingPageSkeleton />;
  if (!session) return <TastingNotFound title="Tasting session not found" backHref="/rnd" backLabel="Back to R&D" />;
  if (!recipe) return <TastingNotFound title="Dish not found" backHref={sessionHref} backLabel="Back to session" />;

  return (
    <Page>
      <div className="flex flex-col gap-4">
        <BackLink href={sessionHref} label="Back to session" />
        <SectionHeader
          eyebrow={session.name}
          title={formatDisplayName(recipe.name)}
          description={recipe.description?.trim() || 'No description'}
        />
      </div>

      <SessionFacts session={session}>
        {allergens.length > 0 && (
          <Fact label="Allergens">
            <span className="flex flex-wrap gap-1.5">
              {allergens.map((allergen) => (
                <Badge key={allergen.id} variant="warning" className="text-[13px]">
                  {allergen.name}
                </Badge>
              ))}
            </span>
          </Fact>
        )}
      </SessionFacts>

      <FeedbackSection count={recipeNotes.length} canAdd={!!isInvited} onAdd={add}>
        {recipeNotes.map((note) => (
          <FeedbackNoteCard
            key={note.id}
            note={note}
            currentUserId={userId}
            onUpdate={update}
            onDelete={remove}
            useNoteImages={useTastingNoteImages}
          />
        ))}
      </FeedbackSection>
    </Page>
  );
}
