'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Page } from '@/components/app';
import { TopAppBar } from '@/components/layout/TopAppBar';
import {
  CanvasTab,
  OverviewTab,
  IngredientsTab,
  CostsTab,
  OutletsTab,
  InstructionsTab,
  TastingTab,
  VersionsTab,
} from '@/components/layout/tabs';
import { useAppState } from '@/lib/store';
import { useOutlets } from '@/lib/hooks';
import type { Outlet } from '@/types';

interface TabContentProps {
  outlets: Outlet[] | undefined;
}

function TabContent({ outlets }: TabContentProps) {
  const { canvasTab } = useAppState();

  switch (canvasTab) {
    case 'canvas':
      return <CanvasTab outlets={outlets} />;
    case 'overview':
      return <OverviewTab />;
    case 'ingredients':
      return <IngredientsTab />;
    case 'costs':
      return <CostsTab />;
    case 'outlets':
      return <OutletsTab outlets={outlets} />;
    case 'instructions':
      return <InstructionsTab />;
    case 'tasting':
      return <TastingTab />;
    case 'versions':
      return <VersionsTab />;
    default:
      return <CanvasTab outlets={outlets} />;
  }
}

interface CanvasLayoutProps {
  showBackLink?: boolean;
  showTabs?: boolean;
}

export function CanvasLayout({ showBackLink = false, showTabs = true }: CanvasLayoutProps) {
  const { data: outletsData } = useOutlets({ page_size: 30 });
  const outlets = outletsData?.items;

  return (
    <Page fill>
      {showBackLink && (
        <div className="shrink-0 border-b border-border/60 bg-background px-3">
          <Link
            href="/recipes"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-ink max-sm:min-h-11"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Recipes
          </Link>
        </div>
      )}
      {showTabs && <TopAppBar />}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <TabContent outlets={outlets} />
      </div>
    </Page>
  );
}
