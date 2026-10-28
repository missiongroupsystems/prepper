'use client';

/**
 * RowActions — the visible kebab menu on a catalogue card or list row (Edit, Archive,
 * Unarchive). Always shown, so it is reachable on touch screens where hover never happens.
 * Archive is reversible (soft delete), so it needs no confirm.
 */
import type { MouseEvent, ReactNode } from 'react';
import { Archive, ArchiveRestore, MoreHorizontal, Pencil } from 'lucide-react';
import { Button, Menu, MenuItem, MenuSeparator } from '@/components/ui';

export function RowActions<T>({
  item,
  name,
  isActive,
  onEdit,
  editHref,
  onArchive,
  onUnarchive,
  children,
}: {
  item: T;
  /** The record's display name, for the menu's accessible label. */
  name: string;
  isActive: boolean;
  onEdit?: (item: T) => void;
  /** Edit on a detail page instead of in a panel. */
  editHref?: string;
  onArchive?: (item: T) => void;
  onUnarchive?: (item: T) => void;
  /** Extra items, placed before the archive group. */
  children?: ReactNode;
}) {
  const canEdit = Boolean(onEdit || editHref);
  const archiveItem =
    isActive && onArchive ? (
      <MenuItem icon={Archive} onSelect={() => onArchive(item)}>
        Archive
      </MenuItem>
    ) : !isActive && onUnarchive ? (
      <MenuItem icon={ArchiveRestore} onSelect={() => onUnarchive(item)}>
        Unarchive
      </MenuItem>
    ) : null;

  if (!canEdit && !archiveItem && !children) return null;

  // The menu often sits inside a card that is itself a link: keep the click on the menu.
  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <span onClick={stop} className="inline-flex shrink-0">
      <Menu
        label={`${name} actions`}
        trigger={(props) => (
          <Button variant="ghost" size="icon-sm" aria-label={`${name} actions`} {...props}>
            <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </Button>
        )}
      >
        {canEdit && (
          <MenuItem icon={Pencil} href={editHref} onSelect={onEdit ? () => onEdit(item) : undefined}>
            Edit
          </MenuItem>
        )}
        {children}
        {archiveItem && (canEdit || children) && <MenuSeparator />}
        {archiveItem}
      </Menu>
    </span>
  );
}
