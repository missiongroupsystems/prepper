'use client';

/** One menu item: drag handle, the dish name (opens the editor), its price and a kebab menu. */
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button, Menu, MenuItem } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import { formatCurrency } from '@/lib/utils';
import type { DraftItem } from './menuDraft';
import { DragHandle, type HandleProps } from './Sortable';

export function MenuItemRow({
  item,
  handle,
  onEdit,
  onRemove,
}: {
  item: DraftItem;
  handle: HandleProps;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const name = formatDisplayName(item.recipe_name);
  return (
    <div className="flex items-center gap-2 py-1.5 pr-1 pl-1">
      <DragHandle label={`Reorder ${name}`} {...handle} />
      <button
        type="button"
        onClick={onEdit}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-4 rounded-md px-2 text-left hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="min-w-0 flex-1 truncate text-sm text-ink">{name}</span>
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
          {item.display_price === null ? 'No price' : formatCurrency(item.display_price)}
        </span>
      </button>
      <Menu
        label={`${name} actions`}
        trigger={(props) => (
          <Button variant="ghost" size="icon-sm" aria-label={`${name} actions`} {...props}>
            <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </Button>
        )}
      >
        <MenuItem icon={Pencil} onSelect={onEdit}>
          Edit item
        </MenuItem>
        <MenuItem icon={Trash2} danger onSelect={onRemove}>
          Remove from menu
        </MenuItem>
      </Menu>
    </div>
  );
}
