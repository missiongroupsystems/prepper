'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, FileQuestion, LayoutGrid, LayoutList, List, Pencil } from 'lucide-react';
import { Page, SectionHeader } from '@/components/app';
import { MenuPreviewItem } from '@/components/menu/MenuPreviewItem';
import { EmptyState, SegmentedControl, Skeleton, buttonClasses } from '@/components/ui';
import {
  useAllRecipeRecipeCategories,
  useMenu,
  useRecipeAllergensBatch,
  useRecipeCategories,
  useRecipes,
} from '@/lib/hooks';
import { useAppState } from '@/lib/store';
import { cn } from '@/lib/utils';

type Layout = 'list' | 'card';

const LAYOUTS = [
  { id: 'list', label: 'List', icon: List, iconOnly: true },
  { id: 'card', label: 'Cards', icon: LayoutGrid, iconOnly: true },
];

const backLink = (
  <Link href="/menu" className={buttonClasses('ghost')}>
    <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
    Menus
  </Link>
);

interface PreviewMenuPageProps {
  params: Promise<{ id: string }>;
}

export default function PreviewMenuPage({ params }: PreviewMenuPageProps) {
  const { id } = use(params);
  const menuId = parseInt(id, 10);
  const { data: menu, isLoading, error } = useMenu(menuId);
  const { data: recipesData } = useRecipes({ page_size: 30 });
  const { userType, isManager } = useAppState();
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [layout, setLayout] = useState<Layout>('list');

  const recipeIds = useMemo(() => menu?.sections.flatMap((s) => s.items.map((i) => i.recipe_id)) ?? [], [menu]);
  const { data: allergenMap } = useRecipeAllergensBatch(recipeIds);
  const { data: recipeCategoriesData } = useRecipeCategories({ page_size: 100 });
  const { data: recipeCategoryLinks } = useAllRecipeRecipeCategories();

  const recipesById = useMemo(() => new Map((recipesData?.items ?? []).map((r) => [r.id, r])), [recipesData]);

  const categoryNamesByRecipe = useMemo(() => {
    const categoryNames = new Map((recipeCategoriesData?.items ?? []).map((c) => [c.id, c.name]));
    const byRecipe = new Map<number, string[]>();
    (recipeCategoryLinks ?? []).forEach((link) => {
      const name = categoryNames.get(link.category_id);
      if (!link.is_active || !name) return;
      byRecipe.set(link.recipe_id, [...(byRecipe.get(link.recipe_id) ?? []), name]);
    });
    return byRecipe;
  }, [recipeCategoriesData, recipeCategoryLinks]);

  const toggleSection = (sectionId: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });

  if (isLoading) {
    return (
      <Page>
        <SectionHeader eyebrow="Kitchen · Menus" title="Menu preview" actions={backLink} />
        <Skeleton className="h-96 rounded-lg" />
      </Page>
    );
  }

  if (error || !menu) {
    return (
      <Page>
        <SectionHeader eyebrow="Kitchen · Menus" title="Menu preview" actions={backLink} />
        <EmptyState
          icon={FileQuestion}
          title="Menu not found"
          description="It may have been archived, or you may not have access to it."
        />
      </Page>
    );
  }

  return (
    <Page>
      <SectionHeader
        eyebrow="Kitchen · Menus"
        title={menu.name}
        description={`Version ${menu.version_no} · ${menu.is_published ? 'Published' : 'Draft'}`}
        actions={
          <>
            {backLink}
            {(userType === 'admin' || isManager) && (
              <Link href={`/menu/edit/${menuId}`} className={buttonClasses('primary')}>
                <Pencil className="size-4" strokeWidth={1.5} aria-hidden="true" />
                Edit menu
              </Link>
            )}
          </>
        }
      />

      {menu.sections.length === 0 ? (
        <EmptyState
          icon={LayoutList}
          title="No sections in this menu"
          description="Add sections and dishes in the menu editor."
        />
      ) : (
        <>
          <SegmentedControl
            label="Layout"
            items={LAYOUTS}
            activeId={layout}
            onSelect={(next) => setLayout(next as Layout)}
            className="self-end"
          />
          <div className="flex flex-col gap-4">
            {menu.sections.map((section) => {
              const open = !collapsed.has(section.id);
              const panelId = `menu-section-${section.id}`;
              return (
                <section key={section.id} className="overflow-hidden rounded-lg bg-card hairline">
                  <h2>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={open}
                      aria-controls={panelId}
                      className="flex min-h-11 w-full items-center justify-between gap-4 px-5 py-4 text-left text-lg font-medium text-ink hover:bg-surface-hover"
                    >
                      {section.name}
                      <ChevronDown
                        className={cn('size-5 shrink-0 text-tertiary transition-transform', !open && '-rotate-90')}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </button>
                  </h2>
                  {open && (
                    <div id={panelId} className="border-t border-line p-5">
                      {section.items.length === 0 ? (
                        <EmptyState bare title="No dishes in this section" />
                      ) : (
                        <ul
                          className={
                            layout === 'card' ? 'grid gap-4 sm:grid-cols-2' : 'flex flex-col divide-y divide-line'
                          }
                        >
                          {section.items.map((item) => (
                            <MenuPreviewItem
                              key={item.id}
                              item={item}
                              recipe={recipesById.get(item.recipe_id)}
                              allergens={allergenMap?.get(item.recipe_id) ?? []}
                              categoryNames={categoryNamesByRecipe.get(item.recipe_id) ?? []}
                              layout={layout}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </Page>
  );
}
