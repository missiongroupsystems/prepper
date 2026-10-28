'use client';

import { useState } from 'react';
import { Copy, Download, FileText, MoreHorizontal } from 'lucide-react';
import {
  Button,
  DropdownButton,
  Menu,
  MenuItem,
  MenuRadioItem,
  MenuSeparator,
  SegmentedControl,
  TabRail,
  ViewToggle,
} from '@/components/ui';
import { Section, Subsection } from './primitives';

const TABS = [
  { id: 'overview', label: 'Overview', panelId: 'ds-tab-panel' },
  { id: 'ingredients', label: 'Ingredients', panelId: 'ds-tab-panel' },
  { id: 'costs', label: 'Costs', panelId: 'ds-tab-panel' },
  { id: 'instructions', label: 'Instructions', panelId: 'ds-tab-panel' },
  { id: 'versions', label: 'Versions', panelId: 'ds-tab-panel' },
];

const PERIODS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

const SORTS = ['Name', 'Cost', 'Last edited'];

/** Tabs, view switches and menus. */
export function NavigationSection() {
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState('week');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState('Name');

  return (
    <Section title="Navigation and menus">
      <Subsection title="Tab rail — sections of a page">
        <TabRail items={TABS} activeId={tab} onSelect={setTab} label="Recipe sections" />
        <p id="ds-tab-panel" role="tabpanel" className="pt-3 text-sm text-muted-foreground">
          Showing the {TABS.find((t) => t.id === tab)?.label.toLowerCase()} section. Arrow keys move between tabs.
        </p>
      </Subsection>

      <Subsection title="Segmented control — a view switch over the same data">
        <div className="flex flex-wrap items-center gap-4">
          <SegmentedControl items={PERIODS} activeId={period} onSelect={setPeriod} label="Period" />
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </Subsection>

      <Subsection title="Menu — row actions and choices">
        <div className="flex flex-wrap items-center gap-4">
          <Menu
            label="Recipe actions"
            align="start"
            trigger={(props) => (
              <Button variant="secondary" {...props}>
                Actions
                <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </Button>
            )}
          >
            <MenuItem icon={Copy}>Fork recipe</MenuItem>
            <MenuItem icon={Download}>Export costing</MenuItem>
            <MenuItem icon={FileText} disabled>
              Print card (no printer)
            </MenuItem>
            <MenuSeparator />
            <MenuItem danger>Archive</MenuItem>
          </Menu>
          <Menu
            label="Sort by"
            align="start"
            trigger={(props) => (
              <Button variant="ghost" {...props}>
                Sort: {sort}
              </Button>
            )}
          >
            {SORTS.map((option) => (
              <MenuRadioItem key={option} checked={sort === option} onSelect={() => setSort(option)}>
                {option}
              </MenuRadioItem>
            ))}
          </Menu>
          <DropdownButton
            label="Import"
            icon={<Download className="size-4" strokeWidth={1.5} aria-hidden="true" />}
            items={[
              { label: 'From spreadsheet', onClick: () => undefined },
              { label: 'From supplier catalogue', onClick: () => undefined },
            ]}
          />
        </div>
      </Subsection>
    </Section>
  );
}
