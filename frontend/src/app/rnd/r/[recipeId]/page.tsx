'use client';

import { use, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, Pencil } from 'lucide-react';
import {
  useRecipe,
  useRecipeIngredients,
  useCosting,
  useSubRecipes,
  useRecipes,
  useRecipeVersions,
  useOutlets,
  useRecipeCategoryLinks,
  useRecipeCategories,
  useRecipeAllergens,
} from '@/lib/hooks';
import { useRecipeTastingNotes, useRecipeTastingSummary } from '@/lib/hooks/useTastings';
import { useRecipeOutlets } from '@/lib/hooks/useRecipeOutlets';
import { useAppState } from '@/lib/store';
import { Page, SectionHeader } from '@/components/app';
import { Badge, Skeleton, TabRail, buttonClasses } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import { RecipeStatusBadge } from '@/components/rnd/recipeDisplay';
import { RndRecipeSummary } from '@/components/rnd/RndRecipeSummary';
import { FollowUps } from '@/components/rnd/FollowUps';
import { TastingHistory } from '@/components/rnd/TastingHistory';
import { RecipeMoreInfo } from '@/components/rnd/RecipeMoreInfo';
import { BackLink, TastingNotFound } from '@/components/tasting/TastingPageStates';
import type { Outlet, Recipe } from '@/types';

const RndVersionTree = dynamic(() => import('@/components/rnd/RndVersionTree').then((m) => m.RndVersionTree), {
  ssr: false,
  loading: () => <Skeleton className="m-8 h-28 w-64 rounded-lg" />,
});

const LOOKUP_PAGE_SIZE = 30;
/** The header strip of the full-height Versions tab: the page gutters on the 1080px measure. */
const HEADER_MEASURE = 'mx-auto w-full max-w-(--content-max) px-5 pt-6 pb-4 sm:px-8 sm:pt-8 lg:px-12 lg:pt-10';

const TABS = [
  { id: 'overview', label: 'Overview', panelId: 'rnd-recipe-overview' },
  { id: 'versions', label: 'Iteration history', panelId: 'rnd-recipe-versions' },
] as const;
type TabType = (typeof TABS)[number]['id'];

interface RndRecipePageProps {
  params: Promise<{ recipeId: string }>;
}

function RndRecipeHead({
  recipe,
  isOwner,
  activeTab,
  onTabChange,
}: {
  recipe: Recipe;
  isOwner: boolean;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/rnd" label="Back to R&D" />
      <SectionHeader
        eyebrow="R&D"
        title={formatDisplayName(recipe.name)}
        description={
          <span className="flex flex-wrap items-center gap-1.5">
            <RecipeStatusBadge status={recipe.status} />
            {isOwner && <Badge variant="info" className="text-[13px]">Yours</Badge>}
          </span>
        }
        actions={
          <Link href={`/recipes/${recipe.id}`} className={buttonClasses('secondary', 'md')}>
            {isOwner ? (
              <Pencil className="size-4" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Eye className="size-4" strokeWidth={1.5} aria-hidden="true" />
            )}
            {isOwner ? 'Edit in canvas' : 'View in canvas'}
          </Link>
        }
      />
      <TabRail
        label="Dish sections"
        items={[...TABS]}
        activeId={activeTab}
        onSelect={(id) => onTabChange(id as TabType)}
        className="mt-1"
      />
    </div>
  );
}

export default function RndRecipePage({ params }: RndRecipePageProps) {
  const { recipeId: recipeIdStr } = use(params);
  const recipeId = parseInt(recipeIdStr, 10);
  const { userId } = useAppState();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl === 'versions' ? 'versions' : 'overview');

  const { data: recipe, isLoading: recipeLoading, error: recipeError } = useRecipe(recipeId);
  const { data: ingredients, isLoading: ingredientsLoading } = useRecipeIngredients(recipeId);
  const { data: costing, isLoading: costingLoading } = useCosting(recipeId);
  const { data: subRecipes, isLoading: subRecipesLoading } = useSubRecipes(recipeId);
  const { data: allRecipesData } = useRecipes({ page_size: LOOKUP_PAGE_SIZE });
  const { data: tastingNotes, isLoading: tastingLoading } = useRecipeTastingNotes(recipeId);
  const { data: tastingSummary } = useRecipeTastingSummary(recipeId);
  const { data: versions, isLoading: versionsLoading, error: versionsError } = useRecipeVersions(recipeId, userId);
  const { data: recipeOutlets } = useRecipeOutlets(recipeId);
  const { data: allOutletsData } = useOutlets({ page_size: LOOKUP_PAGE_SIZE });
  const { data: categoryLinks = [] } = useRecipeCategoryLinks(recipeId);
  const { data: allCategoriesData } = useRecipeCategories({ page_size: LOOKUP_PAGE_SIZE });
  const { data: allergens = [] } = useRecipeAllergens(recipeId);

  const isLoading = recipeLoading || ingredientsLoading || costingLoading || subRecipesLoading || tastingLoading;

  if (recipeError) {
    return <TastingNotFound title="Recipe not found or failed to load" backHref="/rnd" backLabel="Back to R&D" />;
  }

  if (isLoading || !recipe) {
    return (
      <Page>
        <BackLink href="/rnd" label="Back to R&D" />
        {isLoading && (
          <div role="status" aria-label="Loading" className="flex flex-col gap-6">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-36 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        )}
      </Page>
    );
  }

  const isOwner = userId !== null && recipe.owner_id === userId;
  const head = <RndRecipeHead recipe={recipe} isOwner={isOwner} activeTab={activeTab} onTabChange={setActiveTab} />;

  if (activeTab === 'versions') {
    return (
      <Page fill>
        <div className={HEADER_MEASURE}>{head}</div>
        <div id="rnd-recipe-versions" role="tabpanel" className="min-h-[400px] flex-1">
          <RndVersionTree recipeId={recipeId} versions={versions} isLoading={versionsLoading} error={versionsError} />
        </div>
      </Page>
    );
  }

  const recipeNames = new Map<number, string>();
  allRecipesData?.items.forEach((r) => recipeNames.set(r.id, r.name));
  const outletMap = new Map<number, Outlet>();
  allOutletsData?.items.forEach((outlet) => outletMap.set(outlet.id, outlet));

  return (
    <Page>
      {head}
      <div id="rnd-recipe-overview" role="tabpanel" className="flex flex-col gap-4">
        <RndRecipeSummary
          recipe={recipe}
          outlets={recipeOutlets}
          outletMap={outletMap}
          categoryLinks={categoryLinks}
          allCategories={allCategoriesData?.items ?? []}
          allergens={allergens}
        />
        <FollowUps recipeId={recipe.id} tastingNotes={tastingNotes} />
        <TastingHistory tastingNotes={tastingNotes} tastingSummary={tastingSummary} />
        <RecipeMoreInfo
          recipe={recipe}
          ingredients={ingredients}
          costing={costing}
          subRecipes={subRecipes}
          recipeNames={recipeNames}
        />
      </div>
    </Page>
  );
}
