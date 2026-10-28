'use client';

import { useState } from 'react';
import { Page, SectionHeader } from '@/components/app';
import { TabRail, type TabRailItem } from '@/components/ui';
import { RndPipelines } from '@/components/rnd/RndPipelines';
import { NewSessionLink, TastingSessionList } from '@/components/tasting/TastingSessionList';

const RND_TABS = [
  { id: 'pipelines', label: 'Pipelines', panelId: 'rnd-panel-pipelines' },
  { id: 'tastings', label: 'Tastings', panelId: 'rnd-panel-tastings' },
] as const satisfies readonly TabRailItem[];

type RndTab = (typeof RND_TABS)[number]['id'];

export default function RndPage() {
  const [tab, setTab] = useState<RndTab>('pipelines');
  const active = RND_TABS.find((t) => t.id === tab) ?? RND_TABS[0];

  return (
    <Page>
      <div className="flex flex-col gap-5">
        <SectionHeader
          title="R&D workspace"
          description="Track and iterate on dishes with tasting feedback."
          actions={tab === 'tastings' ? <NewSessionLink /> : undefined}
        />
        <TabRail
          label="R&D sections"
          items={[...RND_TABS]}
          activeId={tab}
          onSelect={(id) => setTab(id as RndTab)}
        />
      </div>
      <div id={active.panelId} role="tabpanel">
        {tab === 'tastings' ? <TastingSessionList /> : <RndPipelines />}
      </div>
    </Page>
  );
}
