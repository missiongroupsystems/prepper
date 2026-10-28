'use client';

import { ClipboardList, Eraser, GitFork, MoreHorizontal, RotateCcw } from 'lucide-react';
import { Button, Menu, MenuItem, MenuSeparator, PendingButton } from '@/components/ui';

/**
 * The canvas action bar: save state on the left; on the right one primary action (save or create)
 * and everything else in an overflow menu. Reset and Clear are confirmed by the caller.
 */
export function CanvasFooter({
  isNew,
  hasItems,
  hasUnsavedChanges,
  canSave,
  isSaving,
  isForking,
  onSave,
  onPasteList,
  onFork,
  onReset,
  onClear,
}: {
  /** No recipe yet: the primary action creates one. */
  isNew: boolean;
  hasItems: boolean;
  hasUnsavedChanges: boolean;
  canSave: boolean;
  isSaving: boolean;
  isForking: boolean;
  onSave: () => void;
  onPasteList: () => void;
  onFork: () => void;
  onReset: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="min-w-0 truncate text-sm text-tertiary" aria-live="polite">
        {isSaving ? 'Saving…' : isForking ? 'Forking…' : hasUnsavedChanges ? (
          <span className="font-medium text-warning">Unsaved changes</span>
        ) : isNew ? (
          'New recipe'
        ) : (
          'All changes saved'
        )}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Menu
          label="More canvas actions"
          side="top"
          trigger={(props) => (
            <Button {...props} variant="secondary" size="icon" aria-label="More canvas actions">
              <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </Button>
          )}
        >
          <MenuItem icon={ClipboardList} onSelect={onPasteList}>
            Paste ingredient list
          </MenuItem>
          {!isNew && (
            <MenuItem icon={GitFork} onSelect={onFork} disabled={!hasItems || isForking}>
              Fork as new version
            </MenuItem>
          )}
          <MenuSeparator />
          <MenuItem icon={RotateCcw} onSelect={onReset}>
            Reset to last saved
          </MenuItem>
          <MenuItem icon={Eraser} danger onSelect={onClear} disabled={!hasItems}>
            Clear canvas
          </MenuItem>
        </Menu>
        <PendingButton onClick={onSave} pending={isSaving} disabled={!canSave}>
          {isNew ? 'Create recipe' : 'Save changes'}
        </PendingButton>
      </div>
    </div>
  );
}
