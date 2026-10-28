'use client';

/**
 * A fork in the R&D "In progress" column: the dish, the tasting sessions it has been through,
 * and "New session", which opens a panel to schedule a tasting for it.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Wine } from 'lucide-react';
import { useRecipeTastingNotes } from '@/lib/hooks/useTastings';
import { Badge, Button, Card } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Recipe } from '@/types';
import { PortionCost, RecipeStatusBadge, RecipeThumb } from './recipeDisplay';
import { CreateSessionPanel } from './CreateSessionPanel';

interface WipRecipeCardProps {
  recipe: Recipe;
  isOwned: boolean;
}

export function WipRecipeCard({ recipe, isOwned }: WipRecipeCardProps) {
  const { data: tastingNotes } = useRecipeTastingNotes(recipe.id);
  const [showCreate, setShowCreate] = useState(false);

  const sessions = useMemo(() => {
    const byId = new Map<number, { id: number; name: string }>();
    for (const note of tastingNotes ?? []) {
      if (note.session_id && note.session_name && !byId.has(note.session_id)) {
        byId.set(note.session_id, { id: note.session_id, name: note.session_name });
      }
    }
    return Array.from(byId.values());
  }, [tastingNotes]);

  return (
    <>
      <Card className="relative flex flex-col gap-3 border-l-2 border-l-accent">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
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

        <div className="flex flex-wrap items-center gap-2">
          <RecipeStatusBadge status={recipe.status} />
          {isOwned && <Badge variant="info" className="text-[13px]">Yours</Badge>}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-muted-foreground">Tasting sessions</p>
          <div className="relative z-10 flex flex-wrap items-center gap-1.5">
            {sessions.map((session) => (
              <Badge key={session.id} className="gap-1 text-[13px]">
                <Wine className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                {session.name}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
              New session
            </Button>
          </div>
        </div>

        <PortionCost value={recipe.cost_price} />
      </Card>

      <CreateSessionPanel recipe={recipe} open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
