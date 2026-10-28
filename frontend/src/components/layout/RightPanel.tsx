'use client';

/**
 * The canvas library: ingredients and recipes to drag or add onto the canvas. From `lg` it is a
 * fixed rail beside the canvas that collapses to a strip; below `lg` it opens as a SidePanel
 * (`LibraryDrawer`), where the + buttons are the way to add.
 */
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button, SidePanel, Switch } from '@/components/ui';
import { LibraryBrowser } from '@/components/canvas/library/LibraryBrowser';
import { useAppState } from '@/lib/store';
import type { Outlet } from '@/types';

function DragDropSwitch() {
  const { isDragDropEnabled, setIsDragDropEnabled } = useAppState();
  return (
    <Switch
      checked={isDragDropEnabled}
      onChange={(e) => setIsDragDropEnabled(e.currentTarget.checked)}
      label="Drag and drop"
    />
  );
}

interface RightPanelProps {
  outlets?: Outlet[];
}

export function RightPanel({ outlets }: RightPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <aside aria-label="Library" className="flex h-full w-12 shrink-0 flex-col items-center border-l border-border bg-secondary py-2">
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} aria-label="Expand library">
          <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </aside>
    );
  }

  return (
    <aside aria-label="Library" className="flex h-full w-72 shrink-0 flex-col border-l xl:w-80 border-border bg-secondary">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h2 className="text-sm font-medium text-ink">Library</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowForm(true)}
            disabled={showForm}
            aria-label="New ingredient"
          >
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setIsCollapsed(true)} aria-label="Collapse library">
            <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="border-b border-border px-3 py-2">
        <DragDropSwitch />
      </div>
      <LibraryBrowser
        outlets={outlets}
        showForm={showForm}
        onShowForm={() => setShowForm(true)}
        onCloseForm={() => setShowForm(false)}
      />
    </aside>
  );
}

/** The library below `lg`: a SidePanel over the canvas. */
export function LibraryDrawer({ open, onClose, outlets }: RightPanelProps & { open: boolean; onClose: () => void }) {
  const [showForm, setShowForm] = useState(false);
  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Library"
      description="Add ingredients and recipes to the canvas."
      footer={
        <>
          <Button variant="secondary" onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            New ingredient
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="-mx-6 -my-5 flex h-[calc(100%+2.5rem)] flex-col">
        <div className="border-b border-border px-6 py-2">
          <DragDropSwitch />
        </div>
        <LibraryBrowser
          outlets={outlets}
          showForm={showForm}
          onShowForm={() => setShowForm(true)}
          onCloseForm={() => setShowForm(false)}
        />
      </div>
    </SidePanel>
  );
}
