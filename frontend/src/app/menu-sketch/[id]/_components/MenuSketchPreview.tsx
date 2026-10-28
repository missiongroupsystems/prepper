'use client';

import { useState } from 'react';
import { FlaskConical, MessageSquare } from 'lucide-react';
import { useRecipeIngredients } from '@/lib/hooks';
import type { MenuSketchSection, MenuSketchSectionItem, MenuSketchSectionItemComment } from '@/types';
import { cn } from '@/lib/utils';
import { DishFeedbackModal } from '../DishFeedbackModal';
import { chunk, unresolvedCount, type DisplayOptions } from './shared';

const PREVIEW_COLUMNS = 2;

function formatMoney(value: number | null): string {
  return value != null ? `$${Number(value).toFixed(2)}` : '—';
}

function previewCostPercent(item: MenuSketchSectionItem): string {
  return item.sales_price && item.cost_price && Number(item.sales_price) > 0
    ? ((Number(item.cost_price) / Number(item.sales_price)) * 100).toFixed(2) + '%'
    : '—';
}

const countPillClasses =
  'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium tnum transition-colors hover:opacity-80';

function DishPreviewCell({
  item,
  comments,
  onOpenComments,
  display,
}: {
  item: MenuSketchSectionItem;
  comments: MenuSketchSectionItemComment[];
  onOpenComments?: () => void;
  display: DisplayOptions;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const commentCount = unresolvedCount(comments);
  const { data: recipeIngredients = [] } = useRecipeIngredients(display.ingredients ? item.recipe_id : null);

  return (
    <div className={cn('flex flex-col gap-2 px-5 py-4', item.is_highlight && 'bg-surface-selected')}>
      <div className="flex items-baseline gap-3">
        <p className="flex-1 text-base leading-snug font-medium text-ink">{item.recipe_name || '—'}</p>
        {(item.icons ?? []).length > 0 && (
          <div className="flex shrink-0 gap-0.5">
            {(item.icons ?? []).map((ic) => (
              <span key={ic} className="text-sm leading-none">{ic}</span>
            ))}
          </div>
        )}
        <div className="flex shrink-0 items-baseline gap-3 text-right text-[13px] tnum">
          <span className="w-16 text-ink">{formatMoney(item.sales_price)}</span>
          {display.cost && <span className="w-16 text-muted-foreground">{formatMoney(item.cost_price)}</span>}
          {display.costMargins && <span className="w-14 text-tertiary">{previewCostPercent(item)}</span>}
        </div>
      </div>

      <div className="flex items-start gap-2">
        {display.description && item.description?.trim() ? (
          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        ) : (
          <span className="flex-1" />
        )}
        <div className="flex shrink-0 items-center gap-1">
          {display.feedback && (
            <button
              type="button"
              onClick={() => setShowFeedback((v) => !v)}
              aria-label={`Tasting feedback (${item.tasting_notes.length})`}
              title="Tasting feedback"
              className={cn(
                countPillClasses,
                item.tasting_notes.length > 0 || showFeedback
                  ? 'bg-info-subtle text-info'
                  : 'bg-surface-sunken text-muted-foreground'
              )}
            >
              <FlaskConical className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
              {item.tasting_notes.length}
            </button>
          )}
          {display.comments && (
            <button
              type="button"
              onClick={onOpenComments}
              aria-label={`Comments (${commentCount})`}
              title="Comments"
              className={cn(
                countPillClasses,
                commentCount > 0 ? 'bg-warning-subtle text-warning' : 'bg-surface-sunken text-muted-foreground'
              )}
            >
              <MessageSquare className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
              {commentCount}
            </button>
          )}
        </div>
      </div>

      {display.ingredients && recipeIngredients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipeIngredients.map((ri) => (
            <span
              key={ri.id}
              className="inline-flex items-center rounded-full bg-surface-sunken px-2 py-0.5 text-xs text-muted-foreground"
            >
              {ri.ingredient?.name ?? `Ingredient #${ri.ingredient_id}`}
            </span>
          ))}
        </div>
      )}

      {showFeedback && (
        <DishFeedbackModal
          dishName={item.recipe_name ?? ''}
          notes={item.tasting_notes}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}

/** Read-only menu layout: sections as framed two-column tables of dishes. */
export function MenuSketchPreview({
  name,
  sections,
  itemsBySection,
  commentsByItemId,
  onOpenComments,
  display,
}: {
  name: string;
  sections: MenuSketchSection[];
  itemsBySection: Record<number, MenuSketchSectionItem[]>;
  commentsByItemId: Record<number, MenuSketchSectionItemComment[]>;
  onOpenComments: (itemId: number, dishName: string) => void;
  display: DisplayOptions;
}) {
  return (
    <div className="flex flex-col gap-8 text-sm">
      {name && <h2 className="text-center text-2xl font-medium tracking-[-0.015em] text-ink">{name}</h2>}
      {sections.map((section) => {
        const items = itemsBySection[section.id] ?? [];
        const rows = chunk(items, PREVIEW_COLUMNS);
        return (
          <div key={section.id} className="overflow-hidden rounded-lg bg-card hairline">
            <div className="bg-surface-sunken px-5 py-3 text-center text-base font-medium text-ink">
              {section.name || 'Unnamed section'}
            </div>

            <div className="grid grid-cols-1 hairline-t md:grid-cols-2 divide-y divide-border md:divide-x md:divide-y-0">
              {[0, 1].map((col) => (
                <div key={col} className={cn('flex items-center gap-3 px-5 py-2', col === 1 && 'max-md:hidden')}>
                  <span className="flex-1" />
                  <div className="flex shrink-0 gap-3 text-right text-xs font-medium text-muted-foreground">
                    <span className="w-16">Price</span>
                    {display.cost && <span className="w-16">Cost</span>}
                    {display.costMargins && <span className="w-14">%</span>}
                  </div>
                </div>
              ))}
            </div>

            {rows.length === 0 && (
              <div className="px-5 py-5 text-center text-[13px] text-tertiary hairline-t">No dishes</div>
            )}

            {rows.map(([d1, d2], ri) => (
              <div key={ri} className="grid grid-cols-1 hairline-t md:grid-cols-2 divide-y divide-border md:divide-x md:divide-y-0">
                <DishPreviewCell
                  item={d1}
                  comments={commentsByItemId[d1.id] ?? []}
                  onOpenComments={() => onOpenComments(d1.id, d1.recipe_name ?? '')}
                  display={display}
                />
                {d2 ? (
                  <DishPreviewCell
                    item={d2}
                    comments={commentsByItemId[d2.id] ?? []}
                    onOpenComments={() => onOpenComments(d2.id, d2.recipe_name ?? '')}
                    display={display}
                  />
                ) : (
                  <div className="max-md:hidden" />
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
