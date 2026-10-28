'use client';

import Link from 'next/link';
import { Wine } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { useRecipe, useRecipeTastingNotes } from '@/lib/hooks';
import { SectionHeader } from '@/components/app';
import { buttonClasses, Card, EmptyState, Skeleton } from '@/components/ui';
import { RecipeTabPage, RecipeTabState } from '@/components/recipe-tabs/RecipeTabPage';
import type { TastingNoteWithRecipe } from '@/types';

const NOTE_SKELETON_COUNT = 3;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

function NoteField({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-tertiary">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

function TastingNoteCard({ note }: { note: TastingNoteWithRecipe }) {
  return (
    <Link href={`/tastings/${note.session_id}`} className="block rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
      <Card interactive className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-medium text-ink">{note.session_name || 'Untitled session'}</p>
          <p className="text-sm tabular-nums text-muted-foreground">{formatDate(note.session_date)}</p>
        </div>
        <dl className="flex flex-col gap-3">
          <NoteField label="Tasted by">{note.taster_name || 'Anonymous'}</NoteField>
          {note.feedback && <NoteField label="Feedback">{note.feedback}</NoteField>}
          {note.action_items && <NoteField label="Action items">{note.action_items}</NoteField>}
        </dl>
        {!note.feedback && !note.action_items && <p className="text-sm text-tertiary">No feedback recorded</p>}
      </Card>
    </Link>
  );
}

function TastingNotesList({ recipeId }: { recipeId: number }) {
  const { data: notes, isLoading, error } = useRecipeTastingNotes(recipeId);

  if (isLoading) {
    return Array.from({ length: NOTE_SKELETON_COUNT }, (_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />);
  }
  if (error || !notes) {
    return <EmptyState icon={Wine} title="Tasting notes could not be loaded" description="Try again in a moment." />;
  }
  if (notes.length === 0) {
    return (
      <EmptyState
        icon={Wine}
        title="No tasting notes yet"
        description="Add this recipe to a tasting session to collect feedback."
        action={
          <Link href="/tastings/new" className={buttonClasses('secondary')}>
            New tasting session
          </Link>
        }
      />
    );
  }
  return notes.map((note) => <TastingNoteCard key={note.id} note={note} />);
}

export function TastingTab() {
  const { selectedRecipeId } = useAppState();
  const { data: recipe, isLoading, error } = useRecipe(selectedRecipeId);

  const subject = 'its tasting notes';
  if (!selectedRecipeId) return <RecipeTabState state="unselected" subject={subject} icon={Wine} />;
  if (isLoading) return <RecipeTabState state="loading" subject={subject} />;
  if (error || !recipe) return <RecipeTabState state="error" subject={subject} icon={Wine} />;

  return (
    <RecipeTabPage>
      <SectionHeader eyebrow={recipe.name} title="Tasting notes" description="Feedback from every session this recipe was tasted in." />
      <TastingNotesList recipeId={recipe.id} />
    </RecipeTabPage>
  );
}
