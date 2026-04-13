'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useMenuSketch, useUpdateMenuSketch, useForkMenuSketch, useRecipes } from '@/lib/hooks';
import type { Recipe } from '@/types';
import type { SketchSection, SketchDish, SketchComment, SketchComments } from '@/types';
import {
  GitFork,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  ArrowLeft,
  GripVertical,
  Eye,
  Pencil,
  SendHorizonal,
  MessageSquare,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { CommentsPanel } from './CommentsPanel';
import { DishCommentsModal } from './DishCommentsModal';
import dynamic from 'next/dynamic';
const NotesEditor = dynamic(() => import('./NotesEditor').then((m) => m.NotesEditor), { ssr: false });
import { ConfirmModal } from '@/components/ui';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function chunk<T>(arr: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n));
  return result;
}

// ─── Empty factories ──────────────────────────────────────────────────────────
function emptyDish(name = ''): SketchDish {
  return { id: crypto.randomUUID(), name, ingredients: [], sales_price: 0, cost_price: 0, description: '' };
}

function emptySection(name = ''): SketchSection {
  return { id: crypto.randomUUID(), name, dishes: [] };
}

// ─── Icon defs for dish tags ──────────────────────────────────────────────────
const ICON_DEFS: { key: string; label: string; emoji: string }[] = [
  { key: 'signature', label: 'Signature', emoji: '⭐' },
  { key: 'spicy',     label: 'Spicy',     emoji: '🌶️' },
  { key: 'vegetarian',label: 'Vegetarian',emoji: '🌿' },
  { key: 'seafood',   label: 'Seafood',   emoji: '🐟' },
  { key: 'beef',      label: 'Beef',      emoji: '🥩' },
  { key: 'pork',      label: 'Pork',      emoji: '🐷' },
  { key: 'nuts',      label: 'Nuts',      emoji: '🥜' },
];

// ─── Preview components ───────────────────────────────────────────────────────
interface DisplayOptions {
  description: boolean;
  ingredients: boolean;
  costMargins: boolean;
  comments: boolean;
}

function DishPreviewCell({
  dish,
  comments,
  onOpenComments,
  display,
}: {
  dish: SketchDish | undefined;
  comments?: SketchComments;
  onOpenComments?: () => void;
  display: DisplayOptions;
}) {
  const costPct =
    dish && dish.sales_price > 0
      ? ((dish.cost_price / dish.sales_price) * 100).toFixed(2) + '%'
      : '—';
  const commentCount =
    dish?.id ? (comments?.[dish.id] ?? []).filter((c) => !c.resolved).length : 0;
  if (!dish) return <div className="px-4 py-3" />;
  return (
    <div className={`relative px-4 py-3 space-y-2${dish.is_highlight ? ' bg-amber-500/10 dark:bg-amber-500/25' : ''}`}>
      {/* Dish name + icons + prices + comment badge on one row */}
      <div className="flex items-center gap-2">
        <p className="flex-1 text-base font-semibold text-foreground leading-snug">
          {dish.name || '—'}
        </p>
        {dish.icons && dish.icons.length > 0 && (
          <div className="flex shrink-0 gap-0.5">
            {dish.icons.map((key) => {
              const def = ICON_DEFS.find((d) => d.key === key);
              return def ? <span key={key} title={def.label} className="text-sm leading-none">{def.emoji}</span> : null;
            })}
          </div>
        )}
        <div className="flex shrink-0 gap-3 text-right text-xs tabular-nums items-center">
          <span className="text-foreground w-14 text-right">${dish.sales_price.toFixed(2)}</span>
          <span className="text-muted-foreground w-14 text-right">${dish.cost_price.toFixed(2)}</span>
          {display.costMargins && (
            <span className="text-muted-foreground/70 w-12 font-medium text-right">{costPct}</span>
          )}
        </div>
        {display.comments && (
          <button
            type="button"
            onClick={onOpenComments}
            className={`shrink-0 flex items-center gap-0.5 rounded-full border px-1.5 text-[10px] transition-colors hover:opacity-80 ${
              commentCount > 0
                ? 'border-orange-400/50 bg-orange-500/15 text-orange-600 dark:text-orange-400'
                : 'border-border bg-muted/60 text-muted-foreground'
            }`}
          >
            <MessageSquare className="h-2.5 w-2.5" />
            {commentCount}
          </button>
        )}
      </div>
      {/* Description — directly below dish name */}
      {display.description && dish.description?.trim() && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {dish.description}
        </p>
      )}
      {/* Key ingredients */}
      {display.ingredients && (
        <div className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold">Key ingredients:</span>{' '}
          {dish.ingredients.length > 0
            ? (
              <span className="flex flex-wrap gap-1 mt-0.5">
                {dish.ingredients.map((ing, i) => (
                  <span key={i} className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-xs">
                    {ing}
                  </span>
                ))}
              </span>
            )
            : '—'}
        </div>
      )}
    </div>
  );
}

function MenuSketchPreview({
  name,
  sections,
  comments,
  onOpenComments,
  display,
}: {
  name: string;
  sections: SketchSection[];
  comments?: SketchComments;
  onOpenComments?: (dishId: string) => void;
  display: DisplayOptions;
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-8 text-sm">
      {name && (
        <h1 className="text-center text-2xl font-bold tracking-wide text-foreground uppercase">
          {name}
        </h1>
      )}
      {sections.map((section, si) => {
        const pairs = chunk(section.dishes, 2);
        return (
          <div key={si} className="rounded-xl overflow-hidden border border-border shadow-sm">
            {/* Section header */}
            <div className="text-center font-bold tracking-widest uppercase text-sm py-2.5 px-4 bg-muted text-foreground">
              {section.name || 'Unnamed Section'}
            </div>

            {/* Column headers — mirrors DishPreviewCell row structure */}
            <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-muted/30">
              {[0, 1].map((col) => (
                <div key={col} className="flex items-center gap-2 px-4 py-1.5">
                  <span className="flex-1" />
                  <div className="flex shrink-0 gap-3 text-right text-xs font-semibold text-muted-foreground tabular-nums">
                    <span className="w-14 text-right">Price</span>
                    <span className="w-14 text-right">Cost</span>
                    {display.costMargins && <span className="w-12 text-right">%</span>}
                  </div>
                  {/* Invisible spacer matching comment badge width */}
                  {display.comments && (
                    <span aria-hidden className="invisible shrink-0 flex items-center gap-0.5 rounded-full border px-1.5 text-[10px]">
                      <MessageSquare className="h-2.5 w-2.5" />0
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* No dishes */}
            {pairs.length === 0 && (
              <div className="px-4 py-4 text-muted-foreground italic text-xs text-center">
                No dishes
              </div>
            )}

            {/* Dish pairs */}
            {pairs.map(([d1, d2], pi) => (
              <div
                key={pi}
                className={`grid grid-cols-2 divide-x divide-border ${pi > 0 ? 'border-t border-border' : ''}`}
              >
                <DishPreviewCell dish={d1} comments={comments} onOpenComments={d1?.id ? () => onOpenComments?.(d1.id!) : undefined} display={display} />
                <DishPreviewCell dish={d2} comments={comments} onOpenComments={d2?.id ? () => onOpenComments?.(d2.id!) : undefined} display={display} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Dish card (card view) ────────────────────────────────────────────────────
function DishCard({
  id,
  dish,
  onChange,
  onRemove,
  commentCount,
  onOpenComments,
  recipes = [],
}: {
  id: string;
  dish: SketchDish;
  onChange: (patch: Partial<SketchDish>) => void;
  onRemove: () => void;
  commentCount: number;
  onOpenComments: () => void;
  recipes?: Recipe[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [ingredientsText, setIngredientsText] = useState(dish.ingredients.join(', '));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const ingredientsRef = useRef<HTMLTextAreaElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const nameWrapRef = useRef<HTMLDivElement>(null);

  const prevRef = useRef(dish.ingredients);
  useEffect(() => {
    autoResize(ingredientsRef.current);
  }, []);

  useEffect(() => {
    if (prevRef.current !== dish.ingredients) {
      setIngredientsText(dish.ingredients.join(', '));
      prevRef.current = dish.ingredients;
      autoResize(ingredientsRef.current);
    }
  }, [dish.ingredients]);

  useEffect(() => {
    autoResize(descRef.current);
  }, [dish.description]);

  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e: MouseEvent) => {
      if (nameWrapRef.current && !nameWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSuggestions]);

  const recipeSuggestions = dish.name.trim().length > 0
    ? recipes.filter((r) => r.name.toLowerCase().includes(dish.name.toLowerCase())).slice(0, 5)
    : [];

  const costPct = dish.sales_price > 0
    ? ((dish.cost_price / dish.sales_price) * 100).toFixed(1) + '%'
    : '—';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-3 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="space-y-3 pl-5 pr-6">
        <div ref={nameWrapRef} className="relative">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Dish</label>
          <input
            type="text"
            value={dish.name}
            onChange={(e) => { onChange({ name: e.target.value }); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Dish name or search recipes…"
            className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {showSuggestions && recipeSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-card shadow-lg py-1 max-h-48 overflow-auto">
              {recipeSuggestions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange({
                      name: r.name,
                      description: r.description ?? '',
                      cost_price: r.cost_price ?? 0,
                      sales_price: r.selling_price_est ?? 0,
                    });
                    setShowSuggestions(false);
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Key ingredients</label>
          <textarea
            ref={ingredientsRef}
            rows={1}
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            onBlur={(e) => {
              const ingredients = e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
              onChange({ ingredients });
            }}
            onInput={(e) => autoResize(e.currentTarget)}
            onFocus={(e) => autoResize(e.currentTarget)}
            placeholder="e.g. chicken stock, cream, butter"
            className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring overflow-hidden"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Sale price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={dish.sales_price || ''}
              onChange={(e) => onChange({ sales_price: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Cost price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={dish.cost_price || ''}
              onChange={(e) => onChange({ cost_price: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Cost %</label>
            <div className="w-full rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm tabular-nums text-muted-foreground">
              {costPct}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
          <textarea
            ref={descRef}
            rows={1}
            value={dish.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
            onInput={(e) => autoResize(e.currentTarget)}
            onFocus={(e) => autoResize(e.currentTarget)}
            placeholder="Optional dish description…"
            className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring overflow-hidden"
          />
        </div>

        {/* Highlight + Tags (D1, D2) */}
        <div className="space-y-2 pt-1">
          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={dish.is_highlight ?? false}
              onChange={(e) => onChange({ is_highlight: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-border accent-amber-500"
            />
            <span className="text-xs text-muted-foreground">⭐ Highlight dish</span>
          </label>
          <div>
            <button
              type="button"
              onClick={() => setShowTags((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showTags ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Tags{dish.icons && dish.icons.length > 0 ? ` (${dish.icons.length})` : ''}
            </button>
            {showTags && (
              <div className="mt-1.5 grid grid-cols-2 gap-1">
                {ICON_DEFS.map(({ key, label, emoji }) => (
                  <label key={key} className="flex cursor-pointer select-none items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={(dish.icons ?? []).includes(key)}
                      onChange={(e) => {
                        const icons = dish.icons ?? [];
                        onChange({
                          icons: e.target.checked ? [...icons, key] : icons.filter((k) => k !== key),
                        });
                      }}
                      className="h-3.5 w-3.5 rounded border-border"
                    />
                    <span className="text-xs text-muted-foreground">{emoji} {label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onOpenComments}
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors ${commentCount > 0 ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 hover:bg-orange-500/25' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <MessageSquare className="h-3 w-3" />
            {commentCount > 0 ? `Comments (${commentCount})` : 'Comments'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dish row (list view) ──────────────────────────────────────────────────────
function DishRow({
  id,
  dish,
  onChange,
  onRemove,
  onEnter,
  autoFocus,
  commentCount,
  onOpenComments,
  recipes = [],
}: {
  id: string;
  dish: SketchDish;
  onChange: (patch: Partial<SketchDish>) => void;
  onRemove: () => void;
  onEnter: () => void;
  autoFocus?: boolean;
  commentCount: number;
  onOpenComments: () => void;
  recipes?: Recipe[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const nameRef = useRef<HTMLInputElement>(null);
  const nameWrapRef = useRef<HTMLDivElement>(null);
  const [ingredientsText, setIngredientsText] = useState(dish.ingredients.join(', '));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const ingredientsRef = useRef<HTMLTextAreaElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) nameRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    autoResize(ingredientsRef.current);
  }, []);

  const prevRef = useRef(dish.ingredients);
  useEffect(() => {
    if (prevRef.current !== dish.ingredients) {
      setIngredientsText(dish.ingredients.join(', '));
      prevRef.current = dish.ingredients;
      autoResize(ingredientsRef.current);
    }
  }, [dish.ingredients]);

  useEffect(() => {
    autoResize(descRef.current);
  }, [dish.description]);

  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e: MouseEvent) => {
      if (nameWrapRef.current && !nameWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSuggestions]);

  const recipeSuggestions = dish.name.trim().length > 0
    ? recipes.filter((r) => r.name.toLowerCase().includes(dish.name.toLowerCase())).slice(0, 5)
    : [];

  const costPct = dish.sales_price > 0
    ? ((dish.cost_price / dish.sales_price) * 100).toFixed(1) + '%'
    : '—';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-lg border border-border bg-card transition-shadow hover:shadow-sm"
    >
      {/* Main row */}
      <div className="grid grid-cols-[auto_1fr_auto]">
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab touch-none items-center px-2 text-muted-foreground/40 hover:text-muted-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="grid grid-cols-[1fr_1fr_80px_80px_56px] divide-x divide-border">
          <div ref={nameWrapRef} className="relative">
            <input
              ref={nameRef}
              type="text"
              placeholder="Dish name or search recipes…"
              value={dish.name}
              onChange={(e) => { onChange({ name: e.target.value }); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => e.key === 'Enter' && onEnter()}
              className="w-full px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-card focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring/10"
            />
            {showSuggestions && recipeSuggestions.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-0.5 w-56 rounded-md border border-border bg-card shadow-lg py-1 max-h-48 overflow-auto">
                {recipeSuggestions.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange({
                        name: r.name,
                        description: r.description ?? '',
                        cost_price: r.cost_price ?? 0,
                        sales_price: r.selling_price_est ?? 0,
                      });
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea
            ref={ingredientsRef}
            rows={1}
            placeholder="Ingredients (comma-separated)"
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            onBlur={(e) => {
              const ingredients = e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
              onChange({ ingredients });
            }}
            onInput={(e) => autoResize(e.currentTarget)}
            onFocus={(e) => autoResize(e.currentTarget)}
            className="px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-card focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring/10 overflow-hidden"
          />
          <input
            type="number"
            placeholder="Sale"
            step="0.01"
            min="0"
            value={dish.sales_price || ''}
            onChange={(e) => onChange({ sales_price: parseFloat(e.target.value) || 0 })}
            className="px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-card focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <input
            type="number"
            placeholder="Cost"
            step="0.01"
            min="0"
            value={dish.cost_price || ''}
            onChange={(e) => onChange({ cost_price: parseFloat(e.target.value) || 0 })}
            className="px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-card focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <div className="px-3 py-2 text-xs tabular-nums text-muted-foreground text-right">
            {costPct}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="flex items-center justify-center rounded-tr-lg border-l border-border px-2 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Description + Comments */}
      <div className="border-t border-border">
        <div className="flex items-center justify-end px-3 py-1">
          <button
            type="button"
            onClick={onOpenComments}
            className={`flex items-center gap-1 text-xs transition-colors ${commentCount > 0 ? 'text-orange-600 dark:text-orange-400 hover:text-orange-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <MessageSquare className="h-3 w-3" />
            {commentCount > 0 && (
              <span className="rounded-full border border-orange-400/50 bg-orange-500/15 px-1 text-[10px]">
                {commentCount}
              </span>
            )}
          </button>
        </div>
        <textarea
          ref={descRef}
          rows={1}
          placeholder="Description (optional)"
          value={dish.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          onInput={(e) => autoResize(e.currentTarget)}
          onFocus={(e) => autoResize(e.currentTarget)}
          className="w-full overflow-hidden border-t border-border px-3 py-1.5 text-xs text-muted-foreground placeholder:text-muted-foreground bg-card focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring/10"
        />
        {/* Highlight + Tags (D1, D2) */}
        <div className="border-t border-border px-3 py-2 space-y-2">
          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={dish.is_highlight ?? false}
              onChange={(e) => onChange({ is_highlight: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-border accent-amber-500"
            />
            <span className="text-xs text-muted-foreground">⭐ Highlight dish</span>
          </label>
          <div>
            <button
              type="button"
              onClick={() => setShowTags((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showTags ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Tags{dish.icons && dish.icons.length > 0 ? ` (${dish.icons.length})` : ''}
            </button>
            {showTags && (
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                {ICON_DEFS.map(({ key, label, emoji }) => (
                  <label key={key} className="flex cursor-pointer select-none items-center gap-1">
                    <input
                      type="checkbox"
                      checked={(dish.icons ?? []).includes(key)}
                      onChange={(e) => {
                        const icons = dish.icons ?? [];
                        onChange({
                          icons: e.target.checked ? [...icons, key] : icons.filter((k) => k !== key),
                        });
                      }}
                      className="h-3.5 w-3.5 rounded border-border"
                    />
                    <span className="text-xs text-muted-foreground">{emoji} {label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section card ──────────────────────────────────────────────────────────────
function SectionCard({
  id,
  section,
  viewMode,
  onChange,
  onRemove,
  onDishRemoved,
  onEnterInName,
  autoFocusName,
  comments,
  onOpenComments,
  recipes = [],
}: {
  id: string;
  section: SketchSection;
  viewMode: 'list' | 'card';
  onChange: (patch: Partial<SketchSection>) => void;
  onRemove: () => void;
  onDishRemoved: (dishId: string) => void;
  onEnterInName: () => void;
  autoFocusName?: boolean;
  comments: SketchComments;
  onOpenComments: (dishId: string) => void;
  recipes?: Recipe[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const nameRef = useRef<HTMLInputElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [showNewSuggestions, setShowNewSuggestions] = useState(false);
  const newDishWrapRef = useRef<HTMLDivElement>(null);
  const newDishSuggestions = newDishName.trim().length > 0
    ? recipes.filter((r) => r.name.toLowerCase().includes(newDishName.toLowerCase())).slice(0, 5)
    : [];
  const [confirmRemoveSection, setConfirmRemoveSection] = useState(false);
  const [confirmRemoveDishIdx, setConfirmRemoveDishIdx] = useState<number | null>(null);

  useEffect(() => {
    if (autoFocusName) nameRef.current?.focus();
  }, [autoFocusName]);

  useEffect(() => {
    if (!showNewSuggestions) return;
    const handler = (e: MouseEvent) => {
      if (newDishWrapRef.current && !newDishWrapRef.current.contains(e.target as Node)) {
        setShowNewSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNewSuggestions]);

  const updateDish = (i: number, patch: Partial<SketchDish>) => {
    const dishes = section.dishes.map((d, idx) => (idx === i ? { ...d, ...patch } : d));
    onChange({ dishes });
  };

  const addDish = (name: string) => {
    onChange({ dishes: [...section.dishes, emptyDish(name)] });
  };

  const addDishFromRecipe = (recipe: Recipe) => {
    onChange({
      dishes: [
        ...section.dishes,
        {
          id: crypto.randomUUID(),
          name: recipe.name,
          ingredients: [],
          sales_price: recipe.selling_price_est ?? 0,
          cost_price: recipe.cost_price ?? 0,
          description: recipe.description ?? '',
        },
      ],
    });
    setNewDishName('');
    setShowNewSuggestions(false);
  };

  const removeDish = (i: number) => {
    onChange({ dishes: section.dishes.filter((_, idx) => idx !== i) });
  };

  const handleNewDishKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newDishName.trim()) {
      addDish(newDishName.trim());
      setNewDishName('');
      setShowNewSuggestions(false);
    }
  };

  const dishIds = section.dishes.map((d) => d.id!);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-border bg-muted/30"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <input
          ref={nameRef}
          type="text"
          placeholder="Section name (e.g. Starters)"
          value={section.name}
          onChange={(e) => onChange({ name: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && onEnterInName()}
          className="flex-1 bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <span className="text-xs text-muted-foreground">
          {section.dishes.length} {section.dishes.length === 1 ? 'dish' : 'dishes'}
        </span>
        <button
          onClick={() => setConfirmRemoveSection(true)}
          className="ml-1 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <ConfirmModal
        isOpen={confirmRemoveSection}
        onClose={() => setConfirmRemoveSection(false)}
        onConfirm={() => { onRemove(); setConfirmRemoveSection(false); toast.success('Section deleted'); }}
        title="Delete section"
        message="Are you sure you want to delete this section and all its dishes? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
      <ConfirmModal
        isOpen={confirmRemoveDishIdx !== null}
        onClose={() => setConfirmRemoveDishIdx(null)}
        onConfirm={() => {
          if (confirmRemoveDishIdx !== null) {
            const dish = section.dishes[confirmRemoveDishIdx];
            if (dish?.id) onDishRemoved(dish.id);
            removeDish(confirmRemoveDishIdx);
            setConfirmRemoveDishIdx(null);
            toast.success('Dish deleted');
          }
        }}
        title="Delete dish"
        message="Are you sure you want to delete this dish? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          {/* Dishes */}
          {viewMode === 'list' ? (
            <div className="space-y-1.5">
              {section.dishes.length > 0 && (
                <div className="grid grid-cols-[32px_1fr_1fr_80px_80px_56px_32px] px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span />
                  <span className="px-2">Dish</span>
                  <span className="px-2">Key ingredients</span>
                  <span className="px-2">Sale</span>
                  <span className="px-2">Cost</span>
                  <span className="px-2">%</span>
                  <span />
                </div>
              )}
              <SortableContext items={dishIds} strategy={verticalListSortingStrategy}>
                {section.dishes.map((dish, i) => (
                  <DishRow
                    key={dish.id!}
                    id={dish.id!}
                    dish={dish}
                    onChange={(patch) => updateDish(i, patch)}
                    onRemove={() => setConfirmRemoveDishIdx(i)}
                    onEnter={() => {}}
                    autoFocus={false}
                    commentCount={dish.id ? (comments[dish.id] ?? []).filter((c) => !c.resolved).length : 0}
                    onOpenComments={() => dish.id && onOpenComments(dish.id)}
                    recipes={recipes}
                  />
                ))}
              </SortableContext>
            </div>
          ) : (
            <SortableContext items={dishIds} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {section.dishes.map((dish, i) => (
                  <DishCard
                    key={dish.id!}
                    id={dish.id!}
                    dish={dish}
                    onChange={(patch) => updateDish(i, patch)}
                    onRemove={() => setConfirmRemoveDishIdx(i)}
                    commentCount={dish.id ? (comments[dish.id] ?? []).filter((c) => !c.resolved).length : 0}
                    onOpenComments={() => dish.id && onOpenComments(dish.id)}
                    recipes={recipes}
                  />
                ))}
              </div>
            </SortableContext>
          )}

          {/* Quick-add dish input */}
          <div ref={newDishWrapRef} className="relative">
            <input
              type="text"
              placeholder="Type a dish name or search recipes…"
              value={newDishName}
              onChange={(e) => { setNewDishName(e.target.value); setShowNewSuggestions(true); }}
              onFocus={() => setShowNewSuggestions(true)}
              onKeyDown={handleNewDishKeyDown}
              className="w-full rounded-lg border border-dashed border-border bg-card px-3 py-2 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-0"
            />
            {showNewSuggestions && (newDishSuggestions.length > 0 || newDishName.trim().length > 0) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-0.5 rounded-md border border-border bg-card shadow-lg py-1 max-h-48 overflow-auto">
                {newDishSuggestions.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addDishFromRecipe(r)}
                    className="flex w-full items-center px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                  >
                    {r.name}
                  </button>
                ))}
                {newDishName.trim().length > 0 && (
                  <>
                    {newDishSuggestions.length > 0 && <div className="my-1 border-t border-border" />}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { addDish(newDishName.trim()); setNewDishName(''); setShowNewSuggestions(false); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <span className="text-base leading-none">+</span>
                      Add &ldquo;{newDishName.trim()}&rdquo; as new dish
                    </button>
                  </>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (newDishName.trim()) {
                  addDish(newDishName.trim());
                  setNewDishName('');
                  setShowNewSuggestions(false);
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <SendHorizonal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MenuSketchEditorPage() {
  const params = useParams();
  const router = useRouter();
  const sketchId = Number(params.id);

  const { data: sketch, isLoading } = useMenuSketch(sketchId);
  const updateMutation = useUpdateMenuSketch();
  const forkMutation = useForkMenuSketch();
  const { data: recipesData } = useRecipes();
  const allRecipes: Recipe[] = recipesData?.items ?? [];

  const [name, setName] = useState('');
  const [sections, setSections] = useState<SketchSection[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionIndex, setNewSectionIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [previewMode, setPreviewMode] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [comments, setComments] = useState<SketchComments>({});
  const [activeDishId, setActiveDishId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    description: true,
    ingredients: true,
    costMargins: true,
    comments: true,
  });
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);
  const displayMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDisplayMenu) return;
    const handler = (e: MouseEvent) => {
      if (displayMenuRef.current && !displayMenuRef.current.contains(e.target as Node)) {
        setShowDisplayMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDisplayMenu]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const commentsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (sketch) {
      setName(sketch.name);
      setComments(sketch.comments ?? {});
      setNotes(sketch.notes ?? null);

      // Lazily assign stable UUIDs to any sections or dishes that lack one
      const hadMissingIds = (sketch.sections ?? []).some((s) =>
        !s.id || s.dishes.some((d) => !d.id),
      );
      const sectionsWithIds = (sketch.sections ?? []).map((s) => ({
        ...s,
        id: s.id ?? crypto.randomUUID(),
        dishes: s.dishes.map((d) => ({ ...d, id: d.id ?? crypto.randomUUID() })),
      }));
      setSections(sectionsWithIds);

      if (hadMissingIds) {
        updateMutation.mutate({ id: sketchId, data: { sections: sectionsWithIds } });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sketch]);

  const handleSave = () => {
    updateMutation.mutate(
      { id: sketchId, data: { name, sections } },
      { onSuccess: () => { toast.success('Menu saved'); setIsDirty(false); } },
    );
  };

  const handleNotesSave = (html: string) => {
    updateMutation.mutate({ id: sketchId, data: { notes: html } });
  };

  const handleCommentsChange = (c: SketchComments) => {
    setComments(c);
    if (commentsSaveTimer.current) clearTimeout(commentsSaveTimer.current);
    commentsSaveTimer.current = setTimeout(() => {
      updateMutation.mutate({ id: sketchId, data: { comments: c } });
    }, 600);
  };

  const handleDishCommentChange = (dishId: string, updated: SketchComment[]) => {
    const next = { ...comments };
    if (updated.length === 0) {
      delete next[dishId];
    } else {
      next[dishId] = updated;
    }
    handleCommentsChange(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromSectionIdx = sections.findIndex((s) => s.id === activeId);
    const toSectionIdx = sections.findIndex((s) => s.id === overId);

    if (fromSectionIdx >= 0 && toSectionIdx >= 0) {
      // Section drag
      setSections((prev) => arrayMove(prev, fromSectionIdx, toSectionIdx));
    } else {
      // Dish drag — look up by dish UUID across all sections
      let activeSec = -1, activeDishIdx = -1, overSec = -1, overDishIdx = -1;
      for (let si = 0; si < sections.length; si++) {
        for (let di = 0; di < sections[si].dishes.length; di++) {
          if (sections[si].dishes[di].id === activeId) { activeSec = si; activeDishIdx = di; }
          if (sections[si].dishes[di].id === overId) { overSec = si; overDishIdx = di; }
        }
      }
      if (activeSec >= 0 && activeSec === overSec) {
        setSections((prev) => {
          const next = [...prev];
          next[activeSec] = {
            ...next[activeSec],
            dishes: arrayMove(next[activeSec].dishes, activeDishIdx, overDishIdx),
          };
          return next;
        });
      }
    }
  };

  const handleNewSectionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSectionName.trim()) {
      setSections((prev) => {
        const next = [...prev, emptySection(newSectionName.trim())];
        setNewSectionIndex(next.length - 1);
        return next;
      });
      setNewSectionName('');
      setIsDirty(true);
    }
  };

  const updateSection = (i: number, patch: Partial<SketchSection>) => {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
    setIsDirty(true);
  };

  const removeSection = (i: number) => {
    const dishIds = sections[i]?.dishes.map((d) => d.id).filter(Boolean) as string[];
    setSections((prev) => prev.filter((_, idx) => idx !== i));
    if (dishIds?.length) {
      setComments((prev) => {
        const next = { ...prev };
        dishIds.forEach((id) => delete next[id]);
        return next;
      });
    }
  };

  const handleDishRemoved = (dishId: string) => {
    setComments((prev) => {
      if (!prev[dishId]) return prev;
      const next = { ...prev };
      delete next[dishId];
      return next;
    });
  };

  const activeDish = activeDishId
    ? sections.flatMap((s) => s.dishes).find((d) => d.id === activeDishId)
    : undefined;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  if (!sketch) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-muted-foreground">
        Sketch not found
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-6 py-3">
        {/* Back */}
        <button
          onClick={() => router.push('/menu')}
          className="flex items-center gap-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-px bg-border" />

        {/* Editable name */}
        {editingName ? (
          <input
            autoFocus
            className="rounded border border-border bg-card px-2 py-1 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={name}
            onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
          />
        ) : (
          <button
            className="text-sm font-semibold text-foreground hover:underline"
            onClick={() => setEditingName(true)}
          >
            {name || 'Untitled Menu'}
          </button>
        )}

        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          v{sketch.version}
        </span>

        {isDirty && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Unsaved changes
          </span>
        )}

        <div className="flex-1" />

        {/* View toggle (hidden in preview mode) */}
        {!previewMode && (
          <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'card'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Display options — only in preview mode */}
        {previewMode && (
          <div className="relative" ref={displayMenuRef}>
            <button
              onClick={() => setShowDisplayMenu((v) => !v)}
              className={`flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted ${showDisplayMenu ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Display
            </button>
            {showDisplayMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-card shadow-lg py-1">
                {(
                  [
                    { key: 'description', label: 'Description' },
                    { key: 'ingredients', label: 'Key ingredients' },
                    { key: 'costMargins', label: 'Cost margins' },
                    { key: 'comments', label: 'Comments' },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDisplayOptions((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted"
                  >
                    <span className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${displayOptions[key] ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                      {displayOptions[key] && <Check className="h-2.5 w-2.5" />}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview toggle */}
        <button
          onClick={() => setPreviewMode((v) => !v)}
          title={previewMode ? 'Back to edit' : 'Preview'}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {previewMode ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {previewMode ? 'Edit' : 'Preview'}
        </button>

        {/* Comments panel toggle */}
        <button
          onClick={() => setShowComments((v) => !v)}
          title={showComments ? 'Hide comments' : 'Show comments'}
          className={`flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted ${
            showComments ? 'bg-muted text-foreground' : 'text-muted-foreground'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Comments
        </button>

        {/* Fork */}
        <button
          onClick={() => forkMutation.mutate(sketchId)}
          disabled={forkMutation.isPending}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <GitFork className="h-3.5 w-3.5" />
          Fork
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {updateMutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Editor body / Preview + Comments panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto min-w-0">
        {previewMode ? (
          <MenuSketchPreview name={name} sections={sections} comments={comments} onOpenComments={setActiveDishId} display={displayOptions} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="mx-auto max-w-4xl px-6 py-8 space-y-4">
              {/* Sections */}
              <SortableContext
                items={sections.map((s) => s.id!)}
                strategy={verticalListSortingStrategy}
              >
                {sections.map((section, i) => (
                  <SectionCard
                    key={section.id!}
                    id={section.id!}
                    section={section}
                    viewMode={viewMode}
                    onChange={(patch) => updateSection(i, patch)}
                    onRemove={() => removeSection(i)}
                    onDishRemoved={handleDishRemoved}
                    onEnterInName={() => {
                      const el = document.querySelector<HTMLInputElement>(
                        'input[placeholder*="section name"]',
                      );
                      el?.focus();
                    }}
                    autoFocusName={newSectionIndex === i}
                    comments={comments}
                    onOpenComments={setActiveDishId}
                    recipes={allRecipes}
                  />
                ))}
              </SortableContext>

              {/* New section input at bottom */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type a section name and press Enter to add…"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={handleNewSectionKeyDown}
                  className="w-full rounded-xl border border-dashed border-border bg-card px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSectionName.trim()) {
                      setSections((prev) => {
                        const next = [...prev, emptySection(newSectionName.trim())];
                        setNewSectionIndex(next.length - 1);
                        return next;
                      });
                      setNewSectionName('');
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <SendHorizonal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </DndContext>
        )}
        </div>

        {/* Right: Comments panel */}
        {showComments && (
          <div className="hidden lg:flex w-[300px] shrink-0 overflow-hidden flex-col">
            <CommentsPanel
              sections={sections}
              comments={comments}
              onChange={handleCommentsChange}
            />
          </div>
        )}
      </div>

      {/* Notes section */}
      <div className="shrink-0 border-t border-border">
        <button
          type="button"
          onClick={() => setNotesOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-6 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {notesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Menu Notes
        </button>
        {notesOpen && (
          <div className="px-6 pb-4">
            <NotesEditor initialContent={notes} onChange={setNotes} onSave={handleNotesSave} />
          </div>
        )}
      </div>

      {/* Dish comments modal — rendered outside scroll container */}
      {activeDishId && activeDish && (
        <DishCommentsModal
          dishName={activeDish.name}
          dishComments={comments[activeDishId] ?? []}
          onClose={() => setActiveDishId(null)}
          onChange={(updated) => handleDishCommentChange(activeDishId, updated)}
        />
      )}
    </div>
  );
}
