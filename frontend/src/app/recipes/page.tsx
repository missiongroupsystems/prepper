'use client';

/**
 * Dishes — the dish library and the dish categories that group it, in one page shell (Page +
 * SectionHeader) over a TabRail. The selected tab lives in app state so it survives a trip to a
 * dish or a category and back.
 */
import { Page, SectionHeader } from '@/components/app';
import { TabRail } from '@/components/ui';
import { RecipeCategoriesTab, RecipeManagementTab } from '@/components/recipes';
import { useAppState, type RecipeTab } from '@/lib/store';

const RECIPE_TABS: { id: RecipeTab; label: string }[] = [
  { id: 'management', label: 'Dishes' },
  { id: 'categories', label: 'Categories' },
];

const panelId = (id: RecipeTab) => `recipes-panel-${id}`;

export default function RecipesPage() {
  const { recipeTab, setRecipeTab } = useAppState();

  return (
    <Page>
      <SectionHeader
        eyebrow="Kitchen · Dishes"
        title="Dishes"
        description="Every dish and prep recipe, and the categories that group them on a menu."
      />
      <TabRail
        label="Dish sections"
        items={RECIPE_TABS.map((t) => ({ ...t, panelId: panelId(t.id) }))}
        activeId={recipeTab}
        onSelect={(id) => setRecipeTab(id as RecipeTab)}
      />
      <div id={panelId(recipeTab)} role="tabpanel" aria-label={RECIPE_TABS.find((t) => t.id === recipeTab)?.label}>
        {recipeTab === 'categories' ? <RecipeCategoriesTab /> : <RecipeManagementTab />}
      </div>
    </Page>
  );
}
