'use client';

import { RecipeManagementTab } from '@/components/recipes';

export default function RecipesPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        <RecipeManagementTab />
      </div>
    </div>
  );
}
