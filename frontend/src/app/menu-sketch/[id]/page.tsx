'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  useMenuSketch,
  useUpdateMenuSketch,
  useForkMenuSketch,
  useRecipes,
  useMenuSketchSections,
  useUpdateMenuSketchSection,
  useMenuSketchComments,
} from '@/lib/hooks';
import * as api from '@/lib/api';
import type { MenuSketchSectionItem, MenuSketchSectionItemComment } from '@/types';
import { CommentsPanel } from './CommentsPanel';
import { DishCommentsModal } from './DishCommentsModal';
import { AddSectionInput } from './_components/AddSectionInput';
import { EditorHeader } from './_components/EditorHeader';
import { MenuSketchPreview } from './_components/MenuSketchPreview';
import { NotesDrawer } from './_components/NotesDrawer';
import { PageMeasure } from './_components/PageMeasure';
import { SectionBlock } from './_components/SectionBlock';
import type { DisplayOptions, ViewMode } from './_components/shared';
import { Sortable, useSortableOrder } from './_components/sortable';

const DEFAULT_DISPLAY_OPTIONS: DisplayOptions = {
  description: true,
  ingredients: true,
  cost: true,
  costMargins: true,
  comments: true,
  feedback: true,
};

export default function MenuSketchEditorPage() {
  const params = useParams();
  const router = useRouter();
  const sketchId = params.id ? parseInt(params.id as string, 10) : null;

  const { data: sketch } = useMenuSketch(sketchId);
  const { data: sections = [] } = useMenuSketchSections(sketchId);
  const { data: commentsData } = useMenuSketchComments(sketchId);
  const { data: recipesData } = useRecipes();
  const recipes = recipesData?.items ?? [];

  const updateSketch = useUpdateMenuSketch();
  const forkSketch = useForkMenuSketch();
  const updateSection = useUpdateMenuSketchSection();

  const [name, setName] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [previewMode, setPreviewMode] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [activeDishComments, setActiveDishComments] = useState<{ itemId: number; dishName: string } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>(DEFAULT_DISPLAY_OPTIONS);

  // Sync name from server
  const prevSketchRef = useRef<typeof sketch>(undefined);
  if (sketch && sketch !== prevSketchRef.current) {
    setName(sketch.name);
    prevSketchRef.current = sketch;
  }

  const { ordered: orderedSections, sensors, onDragEnd } = useSortableOrder(sections, (section, orderNo) =>
    updateSection.mutate({ id: section.id, data: { order_no: orderNo } })
  );

  // Build commentsByItemId from aggregated response
  const commentsByItemId: Record<number, MenuSketchSectionItemComment[]> = {};
  (commentsData?.data ?? []).forEach(({ menu_sketch_section_item_id, comments }) => {
    commentsByItemId[menu_sketch_section_item_id] = comments;
  });

  // For CommentsPanel and preview: itemsBySection from the per-section queries (shared cache keys)
  const itemQueries = useQueries({
    queries: sections.map((section) => ({
      queryKey: ['menu-sketch-section-items', section.id],
      queryFn: () => api.getMenuSketchSectionItems(section.id),
      enabled: sections.length > 0,
    })),
  });
  const itemsBySection: Record<number, MenuSketchSectionItem[]> = {};
  sections.forEach((section, i) => {
    itemsBySection[section.id] = itemQueries[i]?.data ?? [];
  });

  const handleToggleItem = (itemId: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleCreateTasting = () => {
    const allItems = Object.values(itemsBySection).flat();
    const recipeIds = [...selectedItems]
      .map((itemId) => allItems.find((i) => i.id === itemId)?.recipe_id)
      .filter((id): id is number => id != null);
    if (recipeIds.length === 0) return;
    router.push(`/tastings/new?recipe_ids=${recipeIds.join(',')}`);
  };

  const handleNameSave = () => {
    if (sketchId && name.trim() && name.trim() !== sketch?.name) {
      updateSketch.mutate({ id: sketchId, data: { name: name.trim() } });
    }
  };

  const handleNotesSave = (html: string) => {
    if (sketchId) updateSketch.mutate({ id: sketchId, data: { notes: html } });
  };

  const openDishComments = (itemId: number, dishName: string) => setActiveDishComments({ itemId, dishName });

  if (!sketch) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <EditorHeader
          name={name}
          savedName={sketch.name}
          version={sketch.version}
          onNameChange={setName}
          onNameSave={handleNameSave}
          previewMode={previewMode}
          onTogglePreview={() => setPreviewMode((v) => !v)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          displayOptions={displayOptions}
          onDisplayOptionsChange={setDisplayOptions}
          showComments={showComments}
          onToggleComments={() => setShowComments((v) => !v)}
          selectedCount={selectedItems.size}
          onCreateTasting={handleCreateTasting}
          onFork={() => sketchId && forkSketch.mutate(sketchId)}
          forkPending={forkSketch.isPending}
        />

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <PageMeasure>
            {previewMode ? (
              <MenuSketchPreview
                name={name}
                sections={orderedSections}
                itemsBySection={itemsBySection}
                commentsByItemId={commentsByItemId}
                onOpenComments={openDishComments}
                display={displayOptions}
              />
            ) : (
              <div className="flex flex-col gap-10">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={orderedSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    {orderedSections.map((section) => (
                      <Sortable key={section.id} id={section.id}>
                        {(handle) => (
                          <SectionBlock
                            section={section}
                            commentsByItemId={commentsByItemId}
                            onOpenComments={openDishComments}
                            viewMode={viewMode}
                            recipes={recipes}
                            dragHandleProps={handle}
                            selectedItemIds={selectedItems}
                            onToggleItem={handleToggleItem}
                          />
                        )}
                      </Sortable>
                    ))}
                  </SortableContext>
                </DndContext>

                <AddSectionInput sketchId={sketch.id} nextOrderNo={sections.length} />
              </div>
            )}
          </PageMeasure>
        </div>

        <NotesDrawer notes={sketch.notes} onSave={handleNotesSave} />
      </div>

      {showComments && (
        <aside className="hidden w-72 shrink-0 md:block" aria-label="Comments">
          <CommentsPanel sections={orderedSections} itemsBySection={itemsBySection} commentsByItemId={commentsByItemId} />
        </aside>
      )}

      {activeDishComments && (
        <DishCommentsModal
          itemId={activeDishComments.itemId}
          dishName={activeDishComments.dishName}
          comments={commentsByItemId[activeDishComments.itemId] ?? []}
          onClose={() => setActiveDishComments(null)}
        />
      )}
    </div>
  );
}
