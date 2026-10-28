'use client';

/**
 * The session's dishes. The creator can reorder them by dragging (saved two seconds after the
 * last drop), add or remove them through the dish picker panel, and remove one with a confirm.
 * Everyone can open a dish's inline feedback panel.
 */
import { useEffect, useRef, useState } from 'react';
import { ChefHat, Plus } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Badge, Button, ConfirmModal, EmptyState, Skeleton } from '@/components/ui';
import type { Recipe, RecipeTasting, ReorderSessionDishItem } from '@/types';
import { SortableDishItem } from './SortableDishItem';
import { AddDishesPanel } from './AddDishesPanel';

const REORDER_SAVE_DELAY_MS = 2000;

interface SessionDishesProps {
  sessionId: number;
  sessionRecipes: RecipeTasting[];
  availableRecipes: Recipe[];
  isLoading: boolean;
  isCreator: boolean;
  onAddRecipes: (recipeIds: number[]) => void;
  onRemoveRecipe: (recipeId: number) => Promise<void>;
  onRemoveRecipes: (recipeIds: number[]) => void;
  onReorderDishes: (items: ReorderSessionDishItem[]) => void;
  hasMoreRecipes: boolean;
  onLoadMoreRecipes: () => void;
  isLoadingMoreRecipes: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  reviewedRecipeIds: Set<number>;
  onCreateRecipe: (name: string) => Promise<number>;
  isParticipant: boolean;
  currentUserId: string | null;
}

export function SessionDishes({
  sessionId,
  sessionRecipes,
  availableRecipes,
  isLoading,
  isCreator,
  onAddRecipes,
  onRemoveRecipe,
  onRemoveRecipes,
  onReorderDishes,
  hasMoreRecipes,
  onLoadMoreRecipes,
  isLoadingMoreRecipes,
  searchQuery,
  onSearchChange,
  reviewedRecipeIds,
  onCreateRecipe,
  isParticipant,
  currentUserId,
}: SessionDishesProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [expandedDishId, setExpandedDishId] = useState<number | null>(null);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<number>>(new Set());
  const [localDishes, setLocalDishes] = useState<RecipeTasting[]>(sessionRecipes);
  const [removing, setRemoving] = useState<RecipeTasting | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from server when session recipes change (e.g. after add/remove)
  useEffect(() => {
    setLocalDishes(sessionRecipes);
  }, [sessionRecipes]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localDishes.findIndex((d) => d.id === active.id);
    const newIndex = localDishes.findIndex((d) => d.id === over.id);
    const newDishes = arrayMove(localDishes, oldIndex, newIndex);
    setLocalDishes(newDishes);
    if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current);
    reorderTimerRef.current = setTimeout(() => {
      onReorderDishes(newDishes.map((d, i) => ({ id: d.id, sequence: i + 1 })));
    }, REORDER_SAVE_DELAY_MS);
  };

  const linkedRecipeIds = new Set(sessionRecipes.map((sr) => sr.recipe_id));
  const reviewedCount = sessionRecipes.filter((sr) => reviewedRecipeIds.has(sr.recipe_id)).length;

  const openPicker = () => {
    setSelectedRecipeIds(new Set(linkedRecipeIds));
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
    onSearchChange('');
    setSelectedRecipeIds(new Set());
  };

  const applyPicker = () => {
    const toAdd = [...selectedRecipeIds].filter((id) => !linkedRecipeIds.has(id));
    const toRemove = [...linkedRecipeIds].filter((id) => !selectedRecipeIds.has(id));
    if (toAdd.length === 0 && toRemove.length === 0) return;
    if (toAdd.length > 0) onAddRecipes(toAdd);
    if (toRemove.length > 0) onRemoveRecipes(toRemove);
    closePicker();
  };

  const toggleRecipe = (recipeId: number) => {
    setSelectedRecipeIds((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });
  };

  const createAndSelect = async () => {
    const name = searchQuery.trim();
    if (!name) return;
    try {
      const newId = await onCreateRecipe(name);
      setSelectedRecipeIds((prev) => new Set([...prev, newId]));
    } catch {
      // The parent already showed an error toast.
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setIsRemoving(true);
    try {
      await onRemoveRecipe(removing.recipe_id);
    } finally {
      setIsRemoving(false);
      setRemoving(null);
    }
  };

  return (
    <section aria-labelledby="session-dishes-heading" className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="session-dishes-heading" className="flex items-center gap-2 text-lg font-medium text-ink">
          <ChefHat className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
          Dishes
          {sessionRecipes.length > 0 && (
            <Badge className="text-[13px] tabular-nums">
              {reviewedCount} of {sessionRecipes.length} reviewed by you
            </Badge>
          )}
        </h2>
        {isCreator && (
          <Button variant="secondary" onClick={openPicker}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Add dishes
          </Button>
        )}
      </header>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      )}

      {!isLoading && localDishes.length === 0 && (
        <EmptyState
          icon={ChefHat}
          title="No dishes in this session"
          description="Add dishes to track what will be tasted."
          action={isCreator ? <Button onClick={openPicker}>Add dishes</Button> : undefined}
        />
      )}

      {!isLoading && localDishes.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localDishes.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {localDishes.map((dish) => (
                <SortableDishItem
                  key={dish.id}
                  dish={dish}
                  isCreator={isCreator}
                  isReviewed={reviewedRecipeIds.has(dish.recipe_id)}
                  onRemove={() => setRemoving(dish)}
                  sessionId={sessionId}
                  currentUserId={currentUserId}
                  isParticipant={isParticipant}
                  isExpanded={expandedDishId === dish.recipe_id}
                  onToggle={() => setExpandedDishId(expandedDishId === dish.recipe_id ? null : dish.recipe_id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {isCreator && (
        <AddDishesPanel
          open={showPicker}
          onClose={closePicker}
          linkedRecipeIds={linkedRecipeIds}
          selectedRecipeIds={selectedRecipeIds}
          onToggle={toggleRecipe}
          onApply={applyPicker}
          availableRecipes={availableRecipes}
          hasMoreRecipes={hasMoreRecipes}
          onLoadMoreRecipes={onLoadMoreRecipes}
          isLoadingMoreRecipes={isLoadingMoreRecipes}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onCreateAndSelect={createAndSelect}
        />
      )}

      <ConfirmModal
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        title="Remove dish?"
        message="The dish is taken off this session's tasting list."
        confirmLabel="Remove dish"
        variant="destructive"
        pending={isRemoving}
      />
    </section>
  );
}
