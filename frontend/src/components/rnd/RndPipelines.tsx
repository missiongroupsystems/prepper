'use client';

/**
 * The R&D board: dishes to work on, your in-progress forks, and tasting sessions under review.
 * Three columns from `lg`, one stacked column below.
 */
import { useMemo, useState } from 'react';
import { CheckCircle, ClipboardList, FlaskConical } from 'lucide-react';
import { useRecipesWithFeedback, useTastingSessions } from '@/lib/hooks/useTastings';
import { useForkRecipe, useRecipes } from '@/lib/hooks/useRecipes';
import { SearchInput, Skeleton } from '@/components/ui';
import { useAppState } from '@/lib/store';
import type { Recipe } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { RndRecipeCard } from './RndRecipeCard';
import { WipRecipeCard } from './WipRecipeCard';
import { ReviewSessionCard } from './ReviewSessionCard';

const BOARD_PAGE_SIZE = 30;
const BOARD_GRID = 'grid grid-cols-1 gap-6 lg:grid-cols-3';

function matches(name: string, search: string) {
  return !search || name.toLowerCase().includes(search.toLowerCase());
}

export function RndPipelines() {
  const { userId } = useAppState();
  const { data: recipesWithFeedback, isLoading: isLoadingFeedback, error: feedbackError } = useRecipesWithFeedback(userId);
  const { data: allRecipesData, isLoading: isLoadingRecipes } = useRecipes({ page_size: BOARD_PAGE_SIZE });
  const allRecipes = allRecipesData?.items;
  const { data: tastingSessionsData, isLoading: isLoadingSessions } = useTastingSessions({ page_size: BOARD_PAGE_SIZE });
  const tastingSessions = tastingSessionsData?.items;
  const forkMutation = useForkRecipe();
  const [search, setSearch] = useState('');

  const isLoading = isLoadingFeedback || isLoadingRecipes || isLoadingSessions;

  const filteredSessions = useMemo(
    () => (tastingSessions ?? []).filter((session) => matches(session.name, search)),
    [tastingSessions, search]
  );

  // To do: dishes not started and not ready for review.
  const todoRecipes = useMemo(
    () =>
      (recipesWithFeedback ?? []).filter(
        (recipe) => !recipe.rnd_started && !recipe.review_ready && matches(recipe.name, search)
      ),
    [recipesWithFeedback, search]
  );

  // In progress: your forks of started dishes that are not yet ready for review.
  const wipRecipes = useMemo<Recipe[]>(() => {
    if (!allRecipes || !recipesWithFeedback) return [];
    const startedIds = new Set(allRecipes.filter((r) => r.rnd_started === true && !r.review_ready).map((r) => r.id));
    return allRecipes.filter(
      (recipe) =>
        recipe.root_id !== null &&
        startedIds.has(recipe.root_id) &&
        recipe.owner_id === userId &&
        !recipe.review_ready &&
        matches(recipe.name, search)
    );
  }, [allRecipes, recipesWithFeedback, userId, search]);

  // Review: recipes whose parent is ready for review.
  const readyForReviewRecipeIds = useMemo(() => {
    const ids = new Set<number>();
    if (!allRecipes) return ids;
    for (const recipe of allRecipes) {
      if (!recipe.root_id) continue;
      const parent = allRecipes.find((r) => r.id === recipe.root_id);
      if (parent?.review_ready) ids.add(recipe.id);
    }
    return ids;
  }, [allRecipes]);

  const handleFork = (recipeId: number) => {
    if (!userId) return;
    forkMutation.mutate({ id: recipeId, newOwnerId: userId });
  };

  if (feedbackError) {
    return (
      <div role="alert" className="rounded-lg bg-danger-subtle p-4 text-sm text-danger">
        Failed to load recipes. Please try again.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="w-full sm:max-w-sm">
        <SearchInput
          aria-label="Search dishes"
          placeholder="Search dishes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
      </div>

      {isLoading ? (
        <div className={BOARD_GRID}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-44 rounded-lg" />
              <Skeleton className="h-44 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className={BOARD_GRID}>
          <KanbanColumn
            icon={ClipboardList}
            title="To do"
            count={todoRecipes.length}
            isEmpty={todoRecipes.length === 0}
            emptyTitle="No dishes to work on"
            emptyDescription={search ? 'Nothing matches your search.' : 'Dishes waiting for R&D show up here.'}
          >
            {todoRecipes.map((recipe) => (
              <RndRecipeCard
                key={recipe.id}
                recipe={recipe}
                isOwned={userId !== null && recipe.owner_id === userId}
                onFork={() => handleFork(recipe.id)}
                isForking={forkMutation.isPending && forkMutation.variables?.id === recipe.id}
              />
            ))}
          </KanbanColumn>

          <KanbanColumn
            icon={FlaskConical}
            title="In progress"
            count={wipRecipes.length}
            isEmpty={wipRecipes.length === 0}
            emptyTitle="No work in progress"
            emptyDescription="Fork a dish from To do to start."
          >
            {wipRecipes.map((fork) => (
              <WipRecipeCard key={fork.id} recipe={fork} isOwned={userId !== null && fork.owner_id === userId} />
            ))}
          </KanbanColumn>

          <KanbanColumn
            icon={CheckCircle}
            title="Review"
            isEmpty={filteredSessions.length === 0 || readyForReviewRecipeIds.size === 0}
            emptyTitle="No tasting sessions"
            emptyDescription="Create a session from an in-progress dish."
          >
            {filteredSessions.map((session) => (
              <ReviewSessionCard key={session.id} session={session} readyForReviewRecipeIds={readyForReviewRecipeIds} />
            ))}
          </KanbanColumn>
        </div>
      )}
    </div>
  );
}
