'use client';

/**
 * Settings — one page shell (Page + SectionHeader) over a TabRail of sections. Each tab renders
 * bare content under the rail. The Admin tab is shown to admins only; the API enforces it too.
 */
import { useState } from 'react';
import { useAppState } from '@/lib/store';
import { Page, SectionHeader } from '@/components/app';
import { TabRail } from '@/components/ui';
import { OutletManagementTab } from '@/components/recipes';
import { UserManagementTab } from '@/components/admin';
import { UserProfileTab } from '@/components/settings/UserProfileTab';
import { DesignSystemTab } from './DesignSystemTab';

type SettingsTab = 'users' | 'outlets' | 'admin' | 'design';

const SETTINGS_TABS: { id: SettingsTab; label: string; adminOnly?: boolean }[] = [
  { id: 'users', label: 'Account' },
  { id: 'outlets', label: 'Outlets' },
  { id: 'admin', label: 'Users', adminOnly: true },
  { id: 'design', label: 'Design' },
];

const panelId = (id: SettingsTab) => `settings-panel-${id}`;

function TabContent({ tab, isAdmin, userType }: { tab: SettingsTab; isAdmin: boolean; userType: 'normal' | 'admin' | null }) {
  switch (tab) {
    case 'outlets':
      return <OutletManagementTab userType={userType} />;
    case 'admin':
      return isAdmin ? <UserManagementTab /> : <UserProfileTab />;
    case 'design':
      return <DesignSystemTab />;
    case 'users':
    default:
      return <UserProfileTab />;
  }
}

export default function SettingsPage() {
  const { userType } = useAppState();
  const isAdmin = userType === 'admin';
  const [tab, setTab] = useState<SettingsTab>('users');
  const visibleTabs = SETTINGS_TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <Page>
      <SectionHeader
        eyebrow="Workspace · Settings"
        title="Settings"
        description="Your account, the outlets you work across, and who has access."
      />
      <TabRail
        label="Settings sections"
        items={visibleTabs.map((t) => ({ id: t.id, label: t.label, panelId: panelId(t.id) }))}
        activeId={tab}
        onSelect={(id) => setTab(id as SettingsTab)}
      />
      <div id={panelId(tab)} role="tabpanel" aria-label={visibleTabs.find((t) => t.id === tab)?.label}>
        <TabContent tab={tab} isAdmin={isAdmin} userType={userType} />
      </div>
    </Page>
  );
}
