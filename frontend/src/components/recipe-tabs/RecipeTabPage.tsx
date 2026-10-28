/**
 * RecipeTabPage — the frame every recipe detail tab (except the canvas) renders in. `CanvasLayout`
 * gives a tab a `flex-1 overflow-hidden` slot and no scroll, so this owns the scroll and puts the
 * shell's `Page` inside it: the same 1080px measure and gutters as every other route.
 *
 * `RecipeTabState` is the one way a tab says "no recipe selected", "loading" or "failed".
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChefHat } from 'lucide-react';
import { Page } from '@/components/app';
import { EmptyState, Skeleton } from '@/components/ui';

export function RecipeTabPage({ wide, children }: { wide?: boolean; children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background">
      <Page wide={wide}>{children}</Page>
    </div>
  );
}

type TabState = 'unselected' | 'loading' | 'error';

/** Placeholder heights for the loading skeleton: a header, then the tab's first two surfaces. */
const LOADING_BLOCKS = ['h-12 w-64', 'h-48', 'h-48'];

export function RecipeTabState({
  state,
  subject,
  icon = ChefHat,
}: {
  state: TabState;
  /** What the tab shows, for the "select a recipe" line: "its costs". */
  subject: string;
  icon?: LucideIcon;
}) {
  return (
    <RecipeTabPage>
      {state === 'loading' &&
        LOADING_BLOCKS.map((size, i) => <Skeleton key={i} className={`rounded-lg ${size}`} />)}
      {state === 'unselected' && (
        <EmptyState icon={icon} title="No recipe selected" description={`Pick a recipe to see ${subject}.`} />
      )}
      {state === 'error' && (
        <EmptyState
          icon={icon}
          title="This recipe could not be loaded"
          description="It may have been deleted, or you may not have access to it."
        />
      )}
    </RecipeTabPage>
  );
}
