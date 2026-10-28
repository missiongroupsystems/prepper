'use client';

/**
 * Menu builder (`/menu/new`, `/menu/edit/[id]`). The menu's fields, then its sections as cards of
 * sortable item rows; an item is edited in a SidePanel. No save button — every change autosaves
 * (`useMenuAutosave`), and a new menu is created the moment it has a name and an outlet.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowLeft, Copy, Eye, LayoutList, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Page, SectionHeader } from '@/components/app';
import { Button, EmptyState, buttonClasses } from '@/components/ui';
import { useForkMenu, useRecipeAllergensBatch } from '@/lib/hooks';
import type { MenuDetail } from '@/types';
import * as ops from './draftOps';
import { AddDishesPanel } from './AddDishesPanel';
import { MenuDetailsCard } from './MenuDetailsCard';
import { MenuItemPanel } from './MenuItemPanel';
import { MenuSectionCard } from './MenuSectionCard';
import { SaveIndicator } from './SaveIndicator';
import { Sortable, useSortableSensors } from './Sortable';
import { useMenuAutosave } from './useMenuAutosave';

const MENU_LIST_HREF = '/menu';

export function MenuBuilder({ menu }: { menu?: MenuDetail }) {
  const router = useRouter();
  const { draft, edit, menuId, status, blocker } = useMenuAutosave(menu);
  const forkMenu = useForkMenu();

  const [editing, setEditing] = useState<{ sectionKey: string; itemKey: string } | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const recipeIds = draft.sections.flatMap((s) => s.items.map((i) => i.recipe_id));
  const { data: allergenMap } = useRecipeAllergensBatch(recipeIds);

  const sensors = useSortableSensors();

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    edit((d) => ops.moveSection(d, String(active.id), String(over.id)));
  };

  const removeSection = (sectionKey: string) => {
    const index = draft.sections.findIndex((s) => s.key === sectionKey);
    const section = draft.sections[index];
    edit((d) => ops.removeSection(d, sectionKey));
    toast(`Removed ${section.name || 'section'}`, {
      action: { label: 'Undo', onClick: () => edit((d) => ops.restoreSection(d, section, index)) },
    });
  };

  const removeItem = (sectionKey: string, itemKey: string) => {
    const items = draft.sections.find((s) => s.key === sectionKey)?.items ?? [];
    const index = items.findIndex((i) => i.key === itemKey);
    const item = items[index];
    edit((d) => ops.removeItem(d, sectionKey, itemKey));
    toast('Removed from menu', {
      action: { label: 'Undo', onClick: () => edit((d) => ops.restoreItem(d, sectionKey, item, index)) },
    });
  };

  const fork = () => {
    if (menuId === null) return;
    forkMenu.mutate(menuId, { onSuccess: (forked) => router.push(`/menu/edit/${forked.id}`) });
  };

  const editingSection = editing && draft.sections.find((s) => s.key === editing.sectionKey);
  const editingItem = editingSection?.items.find((i) => i.key === editing?.itemKey);
  const addingSection = addingTo ? draft.sections.find((s) => s.key === addingTo) : undefined;

  const addSectionButton = (
    <Button variant="secondary" onClick={() => edit(ops.addSection)}>
      <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      Add section
    </Button>
  );

  return (
    <Page>
      <SectionHeader
        eyebrow="Kitchen · Menus"
        title={draft.name.trim() || (menuId === null ? 'New menu' : 'Untitled menu')}
        description={
          <span className="flex flex-wrap items-center gap-x-2">
            {menu && <span>Version {menu.version_no}</span>}
            {menu && <span aria-hidden="true">·</span>}
            <SaveIndicator status={status} blocker={blocker} />
          </span>
        }
        actions={
          <>
            <Link href={MENU_LIST_HREF} className={buttonClasses('ghost')}>
              <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
              Menus
            </Link>
            {menuId !== null && (
              <>
                <Link href={`/menu/preview/${menuId}`} className={buttonClasses('secondary')}>
                  <Eye className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  Preview
                </Link>
                <Button variant="secondary" onClick={fork} loading={forkMenu.isPending}>
                  <Copy className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  Fork
                </Button>
              </>
            )}
          </>
        }
      />

      <MenuDetailsCard
        draft={draft}
        onName={(name) => edit((d) => ({ ...d, name }))}
        onPublished={(is_published) => edit((d) => ({ ...d, is_published }))}
        onOutlet={(outletId, on) => edit((d) => ops.toggleOutlet(d, outletId, on))}
      />

      <section className="flex flex-col gap-4" aria-labelledby="menu-sections-heading">
        <div className="flex items-center justify-between gap-4">
          <h2 id="menu-sections-heading" className="text-base font-medium text-ink">
            Sections
          </h2>
          {draft.sections.length > 0 && addSectionButton}
        </div>

        {draft.sections.length === 0 ? (
          <EmptyState
            icon={LayoutList}
            title="No sections yet"
            description="Sections group the menu — starters, mains, desserts. Add one, then add dishes to it."
            action={addSectionButton}
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={draft.sections.map((s) => s.key)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-4">
                {draft.sections.map((section) => (
                  <Sortable key={section.key} id={section.key}>
                    {(handle) => (
                      <MenuSectionCard
                        section={section}
                        handle={handle}
                        onRename={(name) => edit((d) => ops.renameSection(d, section.key, name))}
                        onRemove={() => removeSection(section.key)}
                        onAddDishes={() => setAddingTo(section.key)}
                        onEditItem={(item) => setEditing({ sectionKey: section.key, itemKey: item.key })}
                        onRemoveItem={(item) => removeItem(section.key, item.key)}
                        onMoveItem={(activeKey, overKey) =>
                          edit((d) => ops.moveItem(d, section.key, activeKey, overKey))
                        }
                      />
                    )}
                  </Sortable>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      {editingSection && editingItem && (
        <MenuItemPanel
          key={editingItem.key}
          item={editingItem}
          sectionRecipeIds={new Set(editingSection.items.map((i) => i.recipe_id))}
          allergens={allergenMap?.get(editingItem.recipe_id) ?? []}
          onChange={(patch) => edit((d) => ops.updateItem(d, editingSection.key, editingItem.key, patch))}
          onClose={() => setEditing(null)}
        />
      )}

      {addingSection && (
        <AddDishesPanel
          section={addingSection}
          onAdd={(recipes) => {
            edit((d) => ops.addItems(d, addingSection.key, recipes));
            setAddingTo(null);
          }}
          onClose={() => setAddingTo(null)}
        />
      )}
    </Page>
  );
}
