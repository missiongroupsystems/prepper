'use client';

/**
 * The recipe canvas: drop ingredients and recipes from the library, edit quantities, units,
 * wastage and suppliers, and see the costs move. The work happens on the canvas; Save writes it
 * (existing sub-recipe quantities autosave on their own).
 *
 * Layout: the working column is capped at the 1080px content measure so cards and rows never
 * stretch across a wide screen; the library is a rail from `lg` and a drawer below it.
 */
import { useCallback, useMemo, useState } from 'react';
import { DndContext, DragOverlay, pointerWithin, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { Grid3x3, Library, List, Table2 } from 'lucide-react';
import { Button, ConfirmModal, SegmentedControl } from '@/components/ui';
import { useAppState, type CanvasViewMode } from '@/lib/store';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Ingredient, Outlet, Recipe } from '@/types';
import { AddIngredientsPanel } from '@/components/canvas/AddIngredientsPanel';
import { CanvasDropZone, CANVAS_DROP_ZONE_ID } from '@/components/canvas/CanvasDropZone';
import { CanvasFooter } from '@/components/canvas/CanvasFooter';
import { CanvasHeader } from '@/components/canvas/CanvasHeader';
import { DragPreview } from '@/components/canvas/DragPreview';
import { calculateCanvasCost } from '@/components/canvas/canvasModel';
import type { DragItem } from '@/components/canvas/types';
import { useCanvasLookups } from '@/components/canvas/useCanvasLookups';
import { useCanvasRecipe } from '@/components/canvas/useCanvasRecipe';
import { useCanvasSave } from '@/components/canvas/useCanvasSave';
import { useIsDesktop } from '@/components/canvas/useIsDesktop';
import { useStagedItems } from '@/components/canvas/useStagedItems';
import { LibraryDrawer, RightPanel } from '../RightPanel';

const VIEW_ITEMS = [
  { id: 'grid', label: 'Card view', icon: Grid3x3, iconOnly: true },
  { id: 'list', label: 'List view', icon: List, iconOnly: true },
  { id: 'table', label: 'Table view', icon: Table2, iconOnly: true },
];

/** The working column: the suite's 1080px measure, centred, with the page gutters. */
const columnClasses = 'mx-auto w-full max-w-(--content-max) px-5 sm:px-8';

type PendingConfirm = 'fork' | 'reset' | 'clear' | null;

/** Reads what dnd-kit carries on a drag start: a library item or a staged one. */
function dragItemOf(event: DragStartEvent): DragItem | null {
  const data = event.active.data.current as
    | { type?: string; ingredient?: Ingredient; recipe?: Recipe; stagedId?: string }
    | undefined;
  if (data?.type === 'ingredient' && data.ingredient) return { type: 'panel-ingredient', ingredient: data.ingredient };
  if (data?.type === 'recipe' && data.recipe) return { type: 'panel-recipe', recipe: data.recipe };
  if (data?.type === 'staged-ingredient' && data.stagedId) return { type: 'staged-ingredient', stagedId: data.stagedId };
  if (data?.type === 'staged-recipe' && data.stagedId) return { type: 'staged-recipe', stagedId: data.stagedId };
  return null;
}

function itemCount(count: number, noun: string) {
  return `${count} ${noun}${count !== 1 ? 's' : ''}`;
}

export function CanvasTab({ outlets }: { outlets?: Outlet[] }) {
  const { selectedRecipeId, isDragDropEnabled, canvasViewMode, setCanvasViewMode } = useAppState();
  const isDesktop = useIsDesktop();
  const { recipes, ingredients, categoryMap, recipeLabels } = useCanvasLookups(outlets);
  const staged = useStagedItems(selectedRecipeId);
  const { stagedIngredients, stagedRecipes, stageIngredient, stageRecipe } = staged;
  const canvas = useCanvasRecipe(staged, recipes);
  const canvasCost = useMemo(
    () => calculateCanvasCost(stagedIngredients, stagedRecipes, recipes),
    [stagedIngredients, stagedRecipes, recipes]
  );
  const saver = useCanvasSave(staged, canvas, recipes, canvasCost);

  const [activeDragItem, setActiveDragItem] = useState<DragItem | null>(null);
  const [showPasteList, setShowPasteList] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  const hasItems = stagedIngredients.length > 0 || stagedRecipes.length > 0;
  const isNew = selectedRecipeId === null;
  const recipeName = formatDisplayName(canvas.metadata.name);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const dragItem = activeDragItem;
      setActiveDragItem(null);
      if (!dragItem || event.over?.id !== CANVAS_DROP_ZONE_ID) return;
      if (dragItem.type === 'panel-ingredient') stageIngredient(dragItem.ingredient);
      if (dragItem.type === 'panel-recipe') stageRecipe(dragItem.recipe);
    },
    [activeDragItem, stageIngredient, stageRecipe]
  );

  const confirmFork = () => {
    if (!hasItems) return;
    setPendingConfirm('fork');
  };

  const runConfirmed = () => {
    const action = pendingConfirm;
    setPendingConfirm(null);
    if (action === 'fork') void saver.fork();
    if (action === 'reset') canvas.reset();
    if (action === 'clear') canvas.clearAll();
  };

  const confirmCopy = {
    fork: {
      title: 'Fork recipe',
      message: `Create version ${(saver.currentVersion ?? 0) + 1} of "${recipeName}" with everything on the canvas, and open it.`,
      confirmLabel: 'Fork',
      variant: 'default' as const,
    },
    reset: {
      title: 'Reset canvas',
      message: 'Discard every change since the last save and go back to the saved recipe.',
      confirmLabel: 'Reset',
      variant: 'destructive' as const,
    },
    clear: {
      title: 'Clear canvas',
      message: `Remove ${itemCount(stagedIngredients.length, 'ingredient')} and ${itemCount(stagedRecipes.length, 'sub-recipe')} from the canvas. Nothing is saved until you save.`,
      confirmLabel: 'Clear',
      variant: 'destructive' as const,
    },
  };
  const confirm = pendingConfirm ? confirmCopy[pendingConfirm] : null;

  return (
    <>
      <DndContext
        collisionDetection={pointerWithin}
        onDragStart={isDragDropEnabled ? (event) => setActiveDragItem(dragItemOf(event)) : undefined}
        onDragEnd={isDragDropEnabled ? handleDragEnd : undefined}
      >
        <div className="flex h-full min-h-0 w-full">
          <section aria-label="Canvas" className="flex min-w-0 flex-1 flex-col bg-background">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className={`${columnClasses} flex min-h-full flex-col gap-5 py-5 sm:py-6`}>
                <CanvasHeader
                  metadata={canvas.metadata}
                  onMetadataChange={canvas.onMetadataChange}
                  canvasCost={canvasCost}
                  rootRecipeName={saver.rootRecipeName}
                  currentVersion={saver.currentVersion}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {itemCount(stagedIngredients.length, 'ingredient')} · {itemCount(stagedRecipes.length, 'sub-recipe')}
                  </p>
                  <div className="flex items-center gap-2">
                    {!isDesktop && (
                      <Button variant="secondary" size="sm" onClick={() => setShowLibrary(true)}>
                        <Library className="size-4" strokeWidth={1.5} aria-hidden="true" />
                        Library
                      </Button>
                    )}
                    <SegmentedControl
                      items={VIEW_ITEMS}
                      activeId={canvasViewMode}
                      label="Canvas view"
                      onSelect={(id) => setCanvasViewMode(id as CanvasViewMode)}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <CanvasDropZone
                    stagedIngredients={stagedIngredients}
                    stagedRecipes={stagedRecipes}
                    actions={staged.actions}
                    supplierMap={staged.supplierMap}
                    categoryMap={categoryMap}
                    recipeLabels={recipeLabels}
                    allRecipes={recipes}
                    allIngredients={ingredients}
                    viewMode={canvasViewMode}
                    emptyActions={
                      <>
                        {!isDesktop && (
                          <Button variant="secondary" onClick={() => setShowLibrary(true)}>
                            Open library
                          </Button>
                        )}
                        <Button variant="secondary" onClick={() => setShowPasteList(true)}>
                          Paste ingredient list
                        </Button>
                      </>
                    }
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-border bg-card/80 py-3 backdrop-blur-sm">
              <div className={columnClasses}>
                <CanvasFooter
                  isNew={isNew}
                  hasItems={hasItems}
                  hasUnsavedChanges={canvas.hasUnsavedChanges}
                  canSave={
                    !!canvas.metadata.name.trim() && (isNew || (saver.isOwner && canvas.hasUnsavedChanges))
                  }
                  isSaving={saver.isSaving}
                  isForking={saver.isForking}
                  onSave={saver.save}
                  onPasteList={() => setShowPasteList(true)}
                  onFork={confirmFork}
                  onReset={() => setPendingConfirm('reset')}
                  onClear={() => setPendingConfirm('clear')}
                />
              </div>
            </div>
          </section>
          {isDesktop && <RightPanel outlets={outlets} />}
        </div>
        {!isDesktop && <LibraryDrawer open={showLibrary} onClose={() => setShowLibrary(false)} outlets={outlets} />}
        {isDragDropEnabled && (
          <DragOverlay>
            {activeDragItem && (
              <DragPreview item={activeDragItem} stagedIngredients={stagedIngredients} stagedRecipes={stagedRecipes} />
            )}
          </DragOverlay>
        )}
      </DndContext>

      <ConfirmModal
        isOpen={confirm !== null}
        onClose={() => setPendingConfirm(null)}
        onConfirm={runConfirmed}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
      />

      <AddIngredientsPanel
        open={showPasteList}
        onClose={() => setShowPasteList(false)}
        ingredients={ingredients}
        stagedIngredients={stagedIngredients}
        setStagedIngredients={staged.setStagedIngredients}
        fetchSuppliersForIngredient={staged.fetchSuppliersForIngredient}
      />
    </>
  );
}
