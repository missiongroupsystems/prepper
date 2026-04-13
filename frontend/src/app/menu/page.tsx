'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Eye, Pencil } from 'lucide-react';
import { useMenuSketches, useCreateMenuSketch, useDeleteMenuSketch, useMenus } from '@/lib/hooks';
import { useAppState } from '@/lib/store';
import { Button, Card, Skeleton, Badge, PageHeader, ConfirmModal } from '@/components/ui';
import { cn } from '@/lib/utils';

type MenuTab = 'draft' | 'recipe';

const MENU_TAB_KEY = 'prepper_menu_tab';

function getSavedTab(): MenuTab {
  if (typeof window === 'undefined') return 'draft';
  const stored = localStorage.getItem(MENU_TAB_KEY);
  return stored === 'recipe' ? 'recipe' : 'draft';
}

export default function MenuPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MenuTab>(getSavedTab);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const switchTab = (tab: MenuTab) => {
    localStorage.setItem(MENU_TAB_KEY, tab);
    setActiveTab(tab);
  };
  const { userType, isManager } = useAppState();
  const canEdit = userType === 'admin' || isManager;

  // Draft menus (canvas sketches)
  const { data: sketches, isLoading: sketchesLoading } = useMenuSketches();
  const createSketch = useCreateMenuSketch();
  const deleteSketch = useDeleteMenuSketch();

  // Recipe menus (structured menus)
  const { data: menus, isLoading: menusLoading } = useMenus();

  const handleNewDraft = () => {
    createSketch.mutate('New Draft Menu');
  };

  return (
    <div className="h-full w-full overflow-auto">
      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === 'draft' && (
          <PageHeader
            title="Menu"
            description="Brainstorm and sketch menus quickly — no recipes required"
          >
            <Button onClick={handleNewDraft} disabled={createSketch.isPending} className="gap-2">
              <Plus className="h-4 w-4" />
              New Draft
            </Button>
          </PageHeader>
        )}

        {activeTab === 'recipe' && (
          <PageHeader
            title="Menu"
            description="Structured menus built from your recipe library"
          >
            {canEdit && (
              <Button onClick={() => router.push('/menu/new')} className="gap-2">
                <Plus className="h-4 w-4" />
                New Menu
              </Button>
            )}
          </PageHeader>
        )}

        {/* Sub-tab Navigation */}
        <div className="flex border-b border-border mb-6">
          {(['draft', 'recipe'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {tab === 'draft' ? 'Draft Menus' : 'Recipe Menus'}
            </button>
          ))}
        </div>

        {/* Draft Menus Tab */}
        {activeTab === 'draft' && (
          sketchesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-lg" />
              ))}
            </div>
          ) : sketches && sketches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sketches.map((sketch) => {
                const unresolved = Object.values(sketch.comments ?? {})
                  .flatMap((c) => c)
                  .filter((c) => !c.resolved).length;
                return (
                  <Card
                    key={sketch.id}
                    className="flex cursor-pointer flex-col justify-between p-4 hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/menu-sketch/${sketch.id}`)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{sketch.name || 'Untitled'}</h3>
                        <Badge variant="secondary" className="shrink-0">
                          v{sketch.version}
                        </Badge>
                        {unresolved > 0 && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 bg-orange-500/15 text-orange-600 border-orange-400/50"
                          >
                            {unresolved} comment{unresolved !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {sketch.sections?.length ?? 0} section
                        {(sketch.sections?.length ?? 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/menu-sketch/${sketch.id}`)}
                        className="flex-1"
                      >
                        Open
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget({ id: sketch.id, name: sketch.name })}
                        disabled={deleteSketch.isPending}
                        title="Delete draft"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-zinc-500 mb-4">No draft menus yet.</p>
              <Button onClick={handleNewDraft} disabled={createSketch.isPending}>
                Create your first draft
              </Button>
            </div>
          )
        )}

        {/* Recipe Menus Tab */}
        {activeTab === 'recipe' && (
          menusLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-lg" />
              ))}
            </div>
          ) : menus && menus.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {menus.map((menu) => (
                <Card
                  key={menu.id}
                  className="flex cursor-pointer flex-col justify-between p-4 hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/menu/preview/${menu.id}`)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{menu.name || 'Untitled'}</h3>
                      <Badge variant="secondary" className="shrink-0">
                        v{menu.version_no}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'shrink-0',
                          menu.is_published
                            ? 'bg-green-500/15 text-green-600 border-green-400/50'
                            : 'bg-zinc-500/15 text-zinc-500'
                        )}
                      >
                        {menu.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/menu/preview/${menu.id}`)}
                      className="flex-1 gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/menu/edit/${menu.id}`)}
                        className="flex-1 gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-zinc-500 mb-4">No recipe menus yet.</p>
              {canEdit && (
                <Button onClick={() => router.push('/menu/new')}>
                  Create your first menu
                </Button>
              )}
            </div>
          )
        )}
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete draft"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteSketch.mutate(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
