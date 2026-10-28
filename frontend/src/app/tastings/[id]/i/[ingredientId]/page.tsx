'use client';

import { useParams } from 'next/navigation';
import { useTastingSession, useIngredientNotes, useIngredientTastingNoteImages } from '@/lib/hooks';
import { useIngredient } from '@/lib/hooks/useIngredients';
import { useAppState } from '@/lib/store';
import { Page, SectionHeader } from '@/components/app';
import { Badge } from '@/components/ui';
import { displayNameParts } from '@/lib/format/displayName';
import { formatUnitPrice } from '@/lib/utils';
import { FeedbackNoteCard } from '@/components/tasting/FeedbackNoteCard';
import { FeedbackSection } from '@/components/tasting/FeedbackSection';
import { Fact, SessionFacts } from '@/components/tasting/SessionFacts';
import { BackLink, TastingNotFound, TastingPageSkeleton } from '@/components/tasting/TastingPageStates';
import { useIngredientFeedback } from '@/components/tasting/useIngredientFeedback';

export default function IngredientTastingPage() {
  const params = useParams();
  const sessionId = params.id ? Number(params.id) : null;
  const ingredientId = params.ingredientId ? Number(params.ingredientId) : null;

  const { userId } = useAppState();
  const { data: session, isLoading: sessionLoading } = useTastingSession(sessionId);
  const { data: ingredient, isLoading: ingredientLoading } = useIngredient(ingredientId);
  const { data: allNotes } = useIngredientNotes(sessionId);
  const { add, update, remove } = useIngredientFeedback(sessionId ?? 0, ingredientId ?? 0, userId);

  const ingredientNotes = allNotes?.filter((n) => n.ingredient_id === ingredientId) || [];

  // Invitation gate
  const isInvited = userId && (session?.participants?.some(p => p.user_id === userId) ?? false);

  const sessionHref = `/tastings/${sessionId}`;

  if (sessionLoading || ingredientLoading) return <TastingPageSkeleton />;
  if (!session) return <TastingNotFound title="Tasting session not found" backHref="/rnd" backLabel="Back to R&D" />;
  if (!ingredient) return <TastingNotFound title="Ingredient not found" backHref={sessionHref} backLabel="Back to session" />;

  const { code, name } = displayNameParts(ingredient.name);

  return (
    <Page>
      <div className="flex flex-col gap-4">
        <BackLink href={sessionHref} label="Back to session" />
        <SectionHeader
          eyebrow={code ? `${session.name} · ${code}` : session.name}
          title={name}
          description={
            <span className="flex flex-wrap gap-1.5">
              {ingredient.is_halal ? (
                <Badge variant="success" className="text-[13px]">Halal</Badge>
              ) : (
                <Badge className="text-[13px]">Non-halal</Badge>
              )}
              {!ingredient.is_active && <Badge variant="warning" className="text-[13px]">Archived</Badge>}
            </span>
          }
        />
      </div>

      <SessionFacts session={session}>
        {ingredient.base_unit && <Fact label="Base unit">{ingredient.base_unit}</Fact>}
        {ingredient.cost_per_base_unit ? (
          <Fact label="Cost">
            <span className="tabular-nums">{formatUnitPrice(ingredient.cost_per_base_unit, ingredient.base_unit)}</span>
          </Fact>
        ) : null}
      </SessionFacts>

      <FeedbackSection
        count={ingredientNotes.length}
        canAdd={!!isInvited}
        onAdd={add}
        actionsPlaceholder="What needs to change (e.g. new supplier)…"
      >
        {ingredientNotes.map((note) => (
          <FeedbackNoteCard
            key={note.id}
            note={note}
            currentUserId={userId}
            onUpdate={update}
            onDelete={remove}
            useNoteImages={useIngredientTastingNoteImages}
            actionsPlaceholder="What needs to change (e.g. new supplier)…"
          />
        ))}
      </FeedbackSection>
    </Page>
  );
}
