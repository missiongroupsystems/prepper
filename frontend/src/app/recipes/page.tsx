'use client';

import { RecipeManagementTab } from '@/components/recipes';
import MenuPage from '@/app/menu/page';
import { useAppState, type RecipeTab as RecipeTabType } from '@/lib/store';
import { cn } from '@/lib/utils';

const RECIPE_TABS: { id: RecipeTabType; label: string }[] = [
  { id: 'management', label: 'Recipes' },
  { id: 'menus',      label: 'Menus'   },
];

function TabContent() {
  const { recipeTab } = useAppState();

  switch (recipeTab) {
    case 'menus':
      return <MenuPage />;
    case 'management':
    default:
      return <RecipeManagementTab />;
  }
}

export default function RecipesPage() {
  const { recipeTab, setRecipeTab } = useAppState();

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <nav className="flex gap-1 px-4" aria-label="Recipe tabs">
          {RECIPE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRecipeTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                recipeTab === tab.id
                  ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <TabContent />
      </div>
    </div>
  );
}
