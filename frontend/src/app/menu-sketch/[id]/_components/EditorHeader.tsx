'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, FlaskConical, GitFork, LayoutGrid, List, MessageSquare, Pencil, SlidersHorizontal } from 'lucide-react';
import { Page } from '@/components/app';
import { Badge, Button, Checkbox, SegmentedControl } from '@/components/ui';
import { cn } from '@/lib/utils';
import { DISPLAY_OPTION_LABELS, inlineFieldClasses, type DisplayOptions, type ViewMode } from './shared';

const VIEW_ITEMS = [
  { id: 'card', label: 'Card view', icon: LayoutGrid, iconOnly: true },
  { id: 'list', label: 'List view', icon: List, iconOnly: true },
];

const ICON_PROPS = { className: 'size-4', strokeWidth: 1.5, 'aria-hidden': 'true' as const };

/** Pinned page head: back, the editable menu name and version, then the editor's actions. */
export function EditorHeader({
  name,
  savedName,
  version,
  onNameChange,
  onNameSave,
  previewMode,
  onTogglePreview,
  viewMode,
  onViewModeChange,
  displayOptions,
  onDisplayOptionsChange,
  showComments,
  onToggleComments,
  selectedCount,
  onCreateTasting,
  onFork,
  forkPending,
}: {
  name: string;
  savedName: string;
  version: number;
  onNameChange: (name: string) => void;
  onNameSave: () => void;
  previewMode: boolean;
  onTogglePreview: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  displayOptions: DisplayOptions;
  onDisplayOptionsChange: (options: DisplayOptions) => void;
  showComments: boolean;
  onToggleComments: () => void;
  selectedCount: number;
  onCreateTasting: () => void;
  onFork: () => void;
  forkPending: boolean;
}) {
  const router = useRouter();
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);

  return (
    <header className="shrink-0 hairline-b bg-background">
      <Page className="flex-row flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4 sm:py-4 lg:py-4">
        <div className="flex min-w-0 flex-1 basis-72 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push('/menu-sketch')}
            aria-label="Back to menu sketches"
            title="Back to menu sketches"
            className="-ml-2 text-muted-foreground"
          >
            <ArrowLeft {...ICON_PROPS} />
          </Button>
          <h1 className="min-w-0 flex-1">
            <input
              type="text"
              aria-label="Menu name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={onNameSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') onNameChange(savedName);
              }}
              placeholder="Untitled"
              className={cn(inlineFieldClasses, 'mx-0 h-10 text-[22px] leading-tight font-medium sm:text-[25px]')}
            />
          </h1>
          <Badge className="tnum">v{version}</Badge>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {!previewMode && (
            <SegmentedControl
              label="Dish layout"
              items={VIEW_ITEMS}
              activeId={viewMode}
              onSelect={(id) => onViewModeChange(id as ViewMode)}
            />
          )}

          {previewMode && (
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDisplayMenu((v) => !v)}
                aria-expanded={showDisplayMenu}
              >
                <SlidersHorizontal {...ICON_PROPS} />
                Display
              </Button>
              {showDisplayMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 flex w-48 flex-col gap-1 rounded-lg bg-popover p-2 shadow-pop hairline">
                  {(Object.keys(displayOptions) as (keyof DisplayOptions)[]).map((key) => (
                    <div key={key} className="rounded-md px-2 py-1 hover:bg-surface-hover">
                      <Checkbox
                        label={DISPLAY_OPTION_LABELS[key]}
                        checked={displayOptions[key]}
                        onChange={(e) => onDisplayOptionsChange({ ...displayOptions, [key]: e.target.checked })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedCount > 0 && !previewMode && (
            <Button
              size="sm"
              onClick={onCreateTasting}
              title={`Create tasting session with ${selectedCount} dish${selectedCount !== 1 ? 'es' : ''}`}
            >
              <FlaskConical {...ICON_PROPS} />
              Tasting ({selectedCount})
            </Button>
          )}

          <Button variant="secondary" size="sm" onClick={onTogglePreview} aria-pressed={previewMode}>
            {previewMode ? <Pencil {...ICON_PROPS} /> : <Eye {...ICON_PROPS} />}
            {previewMode ? 'Edit' : 'Preview'}
          </Button>

          <Button
            variant="secondary"
            size="icon-sm"
            onClick={onToggleComments}
            aria-pressed={showComments}
            aria-label="Comments panel"
            title="Comments panel"
            className={cn(showComments && 'bg-surface-active')}
          >
            <MessageSquare {...ICON_PROPS} />
          </Button>

          <Button variant="secondary" size="sm" onClick={onFork} loading={forkPending} title="Fork sketch">
            {!forkPending && <GitFork {...ICON_PROPS} />}
            Fork
          </Button>
        </div>
      </Page>
    </header>
  );
}
