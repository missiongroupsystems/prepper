'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Copy, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useTastingSession,
  useUpdateTastingSession,
  useDeleteTastingSession,
  useSessionRecipes,
  useAddRecipesToSession,
  useRemoveRecipeFromSession,
  useReorderSessionDishes,
  useInfiniteRecipes,
  useSessionNotes,
  useCreateRecipe,
} from '@/lib/hooks';
import { Page, SectionHeader } from '@/components/app';
import { Badge, Button, ConfirmModal, Menu, MenuItem } from '@/components/ui';
import { SessionDetails } from '@/components/tasting/SessionDetails';
import { SessionDishes } from '@/components/tasting/SessionDishes';
import { SessionIngredients, deriveSessionIngredients } from '@/components/tasting/SessionIngredients';
import {
  BackLink,
  TastingAccessDenied,
  TastingNotFound,
  TastingPageSkeleton,
} from '@/components/tasting/TastingPageStates';
import type { UpdateTastingSessionRequest, ReorderSessionDishItem } from '@/types';
import { useAppState } from '@/lib/store';
import { ApiError } from '@/lib/api';

const RECIPE_PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;
const COPIED_RESET_MS = 2000;
const HTTP_FORBIDDEN = 403;

export default function TastingSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id ? Number(params.id) : null;

  const { userId, userType } = useAppState();
  const { data: session, isLoading: sessionLoading, error: sessionError } = useTastingSession(sessionId);
  const { data: sessionRecipes, isLoading: recipesLoading } = useSessionRecipes(sessionId);
  const { data: sessionNotes } = useSessionNotes(sessionId);

  const reviewedRecipeIds = useMemo(
    () => new Set((sessionNotes || []).filter((n) => n.user_id === userId).map((n) => n.recipe_id)),
    [sessionNotes, userId]
  );

  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Picker search, debounced before it reaches the recipes query.
  const [recipeSearch, setRecipeSearch] = useState('');
  const [debouncedRecipeSearch, setDebouncedRecipeSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedRecipeSearch(recipeSearch), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [recipeSearch]);

  const {
    data: recipesPages,
    fetchNextPage: fetchNextRecipesPage,
    hasNextPage: hasMoreRecipes,
    isFetchingNextPage: isLoadingMoreRecipes,
  } = useInfiniteRecipes({ page_size: RECIPE_PAGE_SIZE, search: debouncedRecipeSearch || undefined });
  const availableRecipes = useMemo(() => recipesPages?.pages.flatMap((p) => p.items) ?? [], [recipesPages]);
  const derivedIngredients = useMemo(() => deriveSessionIngredients(sessionRecipes), [sessionRecipes]);

  const deleteSession = useDeleteTastingSession();
  const updateSession = useUpdateTastingSession();
  const addRecipesToSession = useAddRecipesToSession();
  const removeRecipeFromSession = useRemoveRecipeFromSession();
  const reorderSessionDishes = useReorderSessionDishes();
  const createRecipe = useCreateRecipe();

  // Access control check
  const isInvited = userType === 'admin' ||
    (userId && session?.creator_id === userId) ||
    (userId && (session?.participants?.some(p => p.user_id === userId) ?? false)) || false;

  // Only the session creator can edit/add/delete
  const isCreator = !!(userId && session?.creator_id === userId);

  // Clear the tasting redirect URL when this page is accessed
  useEffect(() => {
    localStorage.removeItem('tasting_redirect_url');
  }, []);

  const handleUpdateSession = async (data: UpdateTastingSessionRequest) => {
    if (!sessionId) return;
    try {
      await updateSession.mutateAsync({ id: sessionId, data });
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const handleAddRecipesToSession = async (recipeIds: number[]) => {
    if (!sessionId) return;
    try {
      await addRecipesToSession.mutateAsync({ sessionId, data: { recipe_ids: recipeIds } });
    } catch (error) {
      console.error('Failed to add recipes to session:', error);
    }
  };

  const handleRemoveRecipeFromSession = async (recipeId: number) => {
    if (!sessionId) return;
    try {
      await removeRecipeFromSession.mutateAsync({ sessionId, recipeId });
    } catch (error) {
      console.error('Failed to remove recipe from session:', error);
    }
  };

  const handleBatchRemoveRecipes = async (recipeIds: number[]) => {
    if (!sessionId) return;
    try {
      await Promise.all(recipeIds.map((recipeId) => removeRecipeFromSession.mutateAsync({ sessionId, recipeId })));
    } catch (error) {
      console.error('Failed to remove recipes from session:', error);
    }
  };

  const handleReorderDishes = (items: ReorderSessionDishItem[]) => {
    if (!sessionId) return;
    reorderSessionDishes.mutate({ sessionId, data: { items } });
  };

  const handleCreateRecipe = async (name: string): Promise<number> => {
    try {
      const newRecipe = await createRecipe.mutateAsync({ name });
      return newRecipe.id;
    } catch {
      toast.error('Failed to create recipe');
      throw new Error('Failed to create recipe');
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionId) return;
    try {
      await deleteSession.mutateAsync(sessionId);
      router.push('/rnd');
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/tastings/invite/${sessionId}`);
      setCopied(true);
      toast.success('Invite link copied to clipboard');
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (sessionLoading) return <TastingPageSkeleton />;

  // Check for 403 Forbidden (access denied)
  const is403Error = sessionError instanceof ApiError && sessionError.status === HTTP_FORBIDDEN;
  if (is403Error) return <TastingAccessDenied />;

  if (!session) return <TastingNotFound title="Tasting session not found" backHref="/rnd" backLabel="Back to R&D" />;

  if (!isInvited) return <TastingAccessDenied />;

  return (
    <Page>
      <div className="flex flex-col gap-4">
        <BackLink href="/rnd" label="Back to R&D" />
        <SectionHeader
          eyebrow="Tasting session"
          title={session.name}
          description={isCreator ? <Badge variant="success" className="text-[13px]">Your session</Badge> : undefined}
          actions={
            <>
              <Button variant="secondary" onClick={handleCopyInvite}>
                {copied ? (
                  <Check className="size-4 text-success" strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <Copy className="size-4" strokeWidth={1.5} aria-hidden="true" />
                )}
                {copied ? 'Copied' : 'Copy invite link'}
              </Button>
              {isCreator && (
                <Menu
                  label="Session actions"
                  trigger={(props) => (
                    <Button {...props} variant="ghost" size="icon" aria-label="More session actions">
                      <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
                    </Button>
                  )}
                >
                  <MenuItem icon={Trash2} danger onSelect={() => setConfirmDelete(true)}>
                    Delete session
                  </MenuItem>
                </Menu>
              )}
            </>
          }
        />
      </div>

      <SessionDetails session={session} isCreator={isCreator} onUpdate={handleUpdateSession} />

      {sessionId && (
        <SessionDishes
          sessionId={sessionId}
          sessionRecipes={sessionRecipes || []}
          availableRecipes={availableRecipes}
          isLoading={recipesLoading}
          isCreator={isCreator}
          onAddRecipes={handleAddRecipesToSession}
          onRemoveRecipe={handleRemoveRecipeFromSession}
          onRemoveRecipes={handleBatchRemoveRecipes}
          onReorderDishes={handleReorderDishes}
          hasMoreRecipes={!!hasMoreRecipes}
          onLoadMoreRecipes={() => fetchNextRecipesPage()}
          isLoadingMoreRecipes={isLoadingMoreRecipes}
          searchQuery={recipeSearch}
          onSearchChange={setRecipeSearch}
          reviewedRecipeIds={reviewedRecipeIds}
          onCreateRecipe={handleCreateRecipe}
          isParticipant={isInvited}
          currentUserId={userId}
        />
      )}

      {sessionId && (
        <SessionIngredients sessionId={sessionId} ingredients={derivedIngredients} isLoading={recipesLoading} />
      )}

      {isCreator && (
        <ConfirmModal
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDeleteSession}
          title="Delete this session?"
          message="This deletes the session and all its notes. It can't be undone."
          confirmLabel="Delete session"
          variant="destructive"
          pending={deleteSession.isPending}
        />
      )}
    </Page>
  );
}
