'use client';

/**
 * The suggested actions from every tasting of the dish, as a checklist. Ticking one marks the
 * note's actions done (autosaved).
 */
import { useCallback, useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { useUpdateTastingNote } from '@/lib/hooks/useTastings';
import { Checkbox, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { TastingNoteWithRecipe } from '@/types';
import { CollapsibleSection } from './CollapsibleSection';
import { formatTastingDate } from './tastingDate';

export function FollowUps({ recipeId, tastingNotes }: { recipeId: number; tastingNotes: TastingNoteWithRecipe[] | undefined }) {
  const updateTastingNote = useUpdateTastingNote();

  const actionables = useMemo(
    () =>
      (tastingNotes ?? [])
        .filter((note) => note.action_items && note.action_items.trim())
        .map((note) => ({
          noteId: note.id,
          sessionId: note.session_id,
          text: (note.action_items ?? '').trim(),
          sessionName: note.session_name,
          sessionDate: note.session_date,
          checked: note.action_items_done,
        })),
    [tastingNotes]
  );

  const handleToggle = useCallback(
    (noteId: number, sessionId: number, currentValue: boolean) => {
      updateTastingNote.mutate({ sessionId, noteId, data: { action_items_done: !currentValue }, recipeId });
    },
    [updateTastingNote, recipeId]
  );

  const remaining = actionables.filter((a) => !a.checked).length;
  const isUpdating = updateTastingNote.isPending;

  return (
    <CollapsibleSection
      icon={ClipboardList}
      title="Follow ups"
      summary={actionables.length > 0 ? `${remaining} of ${actionables.length} to do` : undefined}
    >
      {actionables.length === 0 ? (
        <EmptyState bare icon={ClipboardList} title="No follow ups from tastings yet" className="py-6" />
      ) : (
        <ul className="flex flex-col gap-2">
          {actionables.map((item) => (
            <li
              key={item.noteId}
              className={cn(
                'flex items-start gap-3 rounded-md p-3 hairline',
                item.checked ? 'bg-surface-sunken' : 'bg-card',
                isUpdating && 'opacity-60'
              )}
            >
              <Checkbox
                id={`follow-up-${item.noteId}`}
                checked={item.checked}
                disabled={isUpdating}
                onChange={() => handleToggle(item.noteId, item.sessionId, item.checked)}
                className="mt-0.5"
              />
              <label htmlFor={`follow-up-${item.noteId}`} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1">
                <span
                  className={cn(
                    'text-sm whitespace-pre-line',
                    item.checked ? 'text-muted-foreground line-through' : 'text-ink'
                  )}
                >
                  {item.text}
                </span>
                {item.sessionName && (
                  <span className="text-[13px] text-muted-foreground">
                    From {item.sessionName}
                    {item.sessionDate && ` · ${formatTastingDate(item.sessionDate)}`}
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}
