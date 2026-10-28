'use client';

import { Page, SectionHeader } from '@/components/app';
import { NewSessionLink, TastingSessionList } from '@/components/tasting/TastingSessionList';

export default function TastingsPage() {
  return (
    <Page>
      <SectionHeader
        eyebrow="R&D"
        title="Tasting sessions"
        description="Track dish tastings and the feedback from each session."
        actions={<NewSessionLink />}
      />
      <TastingSessionList />
    </Page>
  );
}
