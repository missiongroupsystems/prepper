'use client';

import type { ComponentType } from 'react';
import { FlaskConical, MessageSquare, Tag, Trash2 } from 'lucide-react';
import type { MenuSketchSectionItem } from '@/types';
import { Checkbox, ConfirmModal, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';
import { DishFeedbackModal } from '../DishFeedbackModal';
import type { DishSave, useDish } from './dish-fields';
import { ICON_DEFS, autoResize } from './shared';

type Dish = ReturnType<typeof useDish>;

/** Description: a field that grows with its text and commits on blur. */
export function DescriptionField({ item, save }: { item: MenuSketchSectionItem; save: DishSave }) {
  return (
    <Textarea
      ref={autoResize}
      rows={2}
      aria-label="Description"
      defaultValue={item.description ?? ''}
      onChange={(e) => autoResize(e.currentTarget)}
      onBlur={(e) => {
        const val = e.target.value.trim() || null;
        if (val !== item.description) save({ description: val });
      }}
      placeholder="Add a description"
      className="min-h-16 resize-none overflow-hidden"
    />
  );
}

function FooterAction({
  icon: Icon,
  label,
  count,
  tone,
  pressed,
  onClick,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: 'true' }>;
  label: string;
  count?: number;
  tone?: 'info' | 'warning' | 'danger';
  pressed?: boolean;
  onClick: () => void;
}) {
  const hasCount = count != null && count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={hasCount ? `${label} (${count})` : label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium tnum max-sm:h-11 max-sm:min-w-11',
        'transition-colors duration-(--dur-quick) hover:bg-surface-hover',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        pressed && 'bg-surface-active text-ink',
        !pressed && hasCount && tone === 'info' && 'text-info',
        !pressed && hasCount && tone === 'warning' && 'text-warning',
        !pressed && !hasCount && 'text-tertiary hover:text-ink',
        tone === 'danger' && 'text-tertiary hover:text-danger'
      )}
    >
      <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
      {hasCount && <span>{count}</span>}
    </button>
  );
}

/** Highlight, then tags · R&D feedback · comments (· remove in list view), over a hairline. */
export function DishFooter({
  item,
  dish,
  unresolvedCount,
  onOpenComments,
  showRemove,
}: {
  item: MenuSketchSectionItem;
  dish: Dish;
  unresolvedCount: number;
  onOpenComments: () => void;
  showRemove?: boolean;
}) {
  const tagCount = (item.icons ?? []).length;
  return (
    <div className="flex flex-col gap-3 hairline-t pt-3">
      <div className="flex items-center gap-1">
        <label className="mr-auto inline-flex min-h-8 cursor-pointer items-center gap-2 text-[13px] text-muted-foreground select-none max-sm:min-h-11">
          <Checkbox checked={item.is_highlight} onChange={(e) => dish.save({ is_highlight: e.target.checked })} />
          Highlight
        </label>
        <FooterAction icon={Tag} label="Tags" count={tagCount} pressed={dish.showIcons} onClick={dish.toggleIcons} />
        <FooterAction
          icon={FlaskConical}
          label="Tasting feedback"
          count={item.tasting_notes.length}
          tone="info"
          onClick={() => dish.setShowFeedback(true)}
        />
        <FooterAction
          icon={MessageSquare}
          label="Comments"
          count={unresolvedCount}
          tone="warning"
          onClick={onOpenComments}
        />
        {showRemove && (
          <FooterAction icon={Trash2} label="Remove dish" tone="danger" onClick={() => dish.setConfirmDelete(true)} />
        )}
      </div>
      {dish.showIcons && <TagPicker icons={item.icons ?? []} onChange={(icons) => dish.save({ icons })} />}
    </div>
  );
}

function TagPicker({ icons, onChange }: { icons: string[]; onChange: (icons: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tags">
      {ICON_DEFS.map(({ key, label }) => {
        const active = icons.includes(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? icons.filter((i) => i !== key) : [...icons, key])}
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium max-sm:h-10',
              'transition-colors duration-(--dur-quick)',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              active ? 'bg-accent text-accent-foreground' : 'bg-surface-sunken text-muted-foreground hover:text-ink'
            )}
          >
            <span aria-hidden="true">{key}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Remove confirmation and the tasting feedback modal for one dish. */
export function DishDialogs({ item, dish }: { item: MenuSketchSectionItem; dish: Dish }) {
  return (
    <>
      <ConfirmModal
        isOpen={dish.confirmDelete}
        onClose={() => dish.setConfirmDelete(false)}
        onConfirm={dish.deleteDish}
        title="Remove dish"
        message={`Remove "${item.recipe_name || 'this dish'}" from the menu?`}
        confirmLabel="Remove"
        variant="destructive"
      />
      {dish.showFeedback && (
        <DishFeedbackModal
          dishName={item.recipe_name ?? ''}
          notes={item.tasting_notes}
          onClose={() => dish.setShowFeedback(false)}
        />
      )}
    </>
  );
}
