'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useMenuSketch, useUpdateMenuSketch, useForkMenuSketch } from '@/lib/hooks';
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
  return { name, dishes: [] };
}

// ─── Preview components ───────────────────────────────────────────────────────
function DishPreviewCell({
  dish,
  comments,
  onOpenComments,
}: {
  dish: SketchDish | undefined;
  comments?: SketchComments;
  onOpenComments?: () => void;
}) {
  const costPct =
    dish && dish.sales_price > 0
      ? ((dish.cost_price / dish.sales_price) * 100).toFixed(2) + '%'
      : '—';
  const commentCount =
    dish?.id ? (comments?.[dish.id] ?? []).filter((c) => !c.resolved).length : 0;
  if (!dish) return <div className="px-4 py-3" />;
  return (
    <div className="relative px-4 py-3 space-y-0.5">
      {/* Prices row (right-aligned) */}
      <div className="flex items-center gap-2">
        <span className="flex-1" />
        <div className="flex shrink-0 gap-4 text-right text-xs tabular-nums">
          <span className="text-foreground w-14">
            ${dish.sales_price.toFixed(2)}
          </span>
          <span className="text-muted-foreground w-14">
            ${dish.cost_price.toFixed(2)}
          </span>
          <span className="text-muted-foreground/70 w-12 font-medium">{costPct}</span>
        </div>
      </div>
      {/* Dish name row with comment badge */}
      <div className="flex items-center justify-between gap-2">
        <p className="flex-1 font-semibold text-foreground leading-snug">
          {dish.name || '—'}
        </p>
        {commentCount > 0 && (
          <button
            type="button"
            onClick={onOpenComments}
            className="shrink-0 rounded-full border border-border bg-muted px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            {commentCount}
          </button>
        )}
      </div>
      {/* Ingredients */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        <span className="font-semibold">Ingredients:</span>{' '}
        {dish.ingredients.length > 0 ? dish.ingredients.join(', ') : '—'}
      </p>
      {dish.description?.trim() && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold">Description:</span>{' '}
          {dish.description}
        </p>
      )}
    </div>
  );
}

function MenuSketchPreview({
  name,
  sections,
  comments,
  onOpenComments,
}: {
  name: string;
  sections: SketchSection[];
  comments?: SketchComments;
  onOpenComments?: (dishId: string) => void;
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

            {/* Column headers */}
            <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-muted/30">
              {[0, 1].map((col) => (
                <div key={col} className="flex items-center gap-2 px-4 py-1.5">
                  <span className="flex-1" />
                  <div className="flex shrink-0 gap-4 text-right text-xs font-semibold text-muted-foreground tabular-nums">
                    <span className="w-14">Price</span>
                    <span className="w-14">Cost</span>
                    <span className="w-12 font-semibold">%</span>
                  </div>
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
                <DishPreviewCell dish={d1} comments={comments} onOpenComments={d1?.id ? () => onOpenComments?.(d1.id!) : undefined} />
                <DishPreviewCell dish={d2} comments={comments} onOpenComments={d2?.id ? () => onOpenComments?.(d2.id!) : undefined} />
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
}: {
  id: string;
  dish: SketchDish;
  onChange: (patch: Partial<SketchDish>) => void;
  onRemove: () => void;
  commentCount: number;
  onOpenComments: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [ingredientsText, setIngredientsText] = useState(dish.ingredients.join(', '));
  const [descOpen, setDescOpen] = useState(!!dish.description?.trim());
  const ingredientsRef = useRef<HTMLTextAreaElement>(null);

  const prevRef = useRef(dish.ingredients);
  useEffect(() => {
    if (prevRef.current !== dish.ingredients) {
      setIngredientsText(dish.ingredients.join(', '));
      prevRef.current = dish.ingredients;
      autoResize(ingredientsRef.current);
    }
  }, [dish.ingredients]);

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
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Dish</label>
          <input
            type="text"
            value={dish.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Dish name"
            className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Ingredients</label>
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

        <div className="grid grid-cols-2 gap-3">
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
        </div>

        <div>
          <button
            type="button"
            onClick={() => setDescOpen((v) => !v)}
            className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {descOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Description
          </button>
          {descOpen && (
            <textarea
              rows={1}
              value={dish.description ?? ''}
              onChange={(e) => onChange({ description: e.target.value })}
              onInput={(e) => autoResize(e.currentTarget)}
              onFocus={(e) => autoResize(e.currentTarget)}
              ref={(el) => autoResize(el)}
              placeholder="Optional dish description…"
              className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring overflow-hidden"
            />
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onOpenComments}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
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
}: {
  id: string;
  dish: SketchDish;
  onChange: (patch: Partial<SketchDish>) => void;
  onRemove: () => void;
  onEnter: () => void;
  autoFocus?: boolean;
  commentCount: number;
  onOpenComments: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const nameRef = useRef<HTMLInputElement>(null);
  const [ingredientsText, setIngredientsText] = useState(dish.ingredients.join(', '));
  const [descOpen, setDescOpen] = useState(!!dish.description?.trim());
  const ingredientsRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) nameRef.current?.focus();
  }, [autoFocus]);

  const prevRef = useRef(dish.ingredients);
  useEffect(() => {
    if (prevRef.current !== dish.ingredients) {
      setIngredientsText(dish.ingredients.join(', '));
      prevRef.current = dish.ingredients;
      autoResize(ingredientsRef.current);
    }
  }, [dish.ingredients]);

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
        <div className="grid grid-cols-[1fr_1fr_80px_80px] divide-x divide-border">
          <input
            ref={nameRef}
            type="text"
            placeholder="Dish name"
            value={dish.name}
            onChange={(e) => onChange({ name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onEnter()}
            className="px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-card focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring/10"
          />
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
        </div>
        <button
          onClick={onRemove}
          className="flex items-center justify-center rounded-tr-lg border-l border-border px-2 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Description toggle + Comments button + sub-row */}
      <div className="border-t border-border">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setDescOpen((v) => !v)}
            className="flex flex-1 items-center gap-1 px-3 py-1 text-left text-xs text-muted-foreground hover:text-foreground"
          >
            {descOpen ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
            <span>Description</span>
          </button>
          <button
            type="button"
            onClick={onOpenComments}
            className="flex items-center gap-1 border-l border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="h-3 w-3" />
            {commentCount > 0 && (
              <span className="rounded-full border border-border bg-muted px-1 text-[10px]">
                {commentCount}
              </span>
            )}
          </button>
        </div>
        {descOpen && (
          <textarea
            rows={1}
            placeholder="Description (optional)"
            value={dish.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
            onInput={(e) => autoResize(e.currentTarget)}
            onFocus={(e) => autoResize(e.currentTarget)}
            ref={(el) => autoResize(el)}
            className="w-full overflow-hidden border-t border-border px-3 py-1.5 text-xs text-muted-foreground placeholder:text-muted-foreground bg-card focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring/10"
          />
        )}
      </div>
    </div>
  );
}

// ─── Section card ──────────────────────────────────────────────────────────────
function SectionCard({
  id,
  sectionIndex,
  section,
  viewMode,
  onChange,
  onRemove,
  onDishRemoved,
  onEnterInName,
  autoFocusName,
  comments,
  onOpenComments,
}: {
  id: string;
  sectionIndex: number;
  section: SketchSection;
  viewMode: 'list' | 'card';
  onChange: (patch: Partial<SketchSection>) => void;
  onRemove: () => void;
  onDishRemoved: (dishId: string) => void;
  onEnterInName: () => void;
  autoFocusName?: boolean;
  comments: SketchComments;
  onOpenComments: (dishId: string) => void;
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
  const [confirmRemoveSection, setConfirmRemoveSection] = useState(false);
  const [confirmRemoveDishIdx, setConfirmRemoveDishIdx] = useState<number | null>(null);

  useEffect(() => {
    if (autoFocusName) nameRef.current?.focus();
  }, [autoFocusName]);

  const updateDish = (i: number, patch: Partial<SketchDish>) => {
    const dishes = section.dishes.map((d, idx) => (idx === i ? { ...d, ...patch } : d));
    onChange({ dishes });
  };

  const addDish = (name: string) => {
    onChange({ dishes: [...section.dishes, emptyDish(name)] });
  };

  const removeDish = (i: number) => {
    onChange({ dishes: section.dishes.filter((_, idx) => idx !== i) });
  };

  const handleNewDishKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newDishName.trim()) {
      addDish(newDishName.trim());
      setNewDishName('');
    }
  };

  const dishIds = section.dishes.map((_, di) => `dish-${sectionIndex}-${di}`);

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
        onConfirm={() => { onRemove(); setConfirmRemoveSection(false); }}
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
                <div className="grid grid-cols-[32px_1fr_1fr_80px_80px_32px] px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span />
                  <span className="px-2">Dish</span>
                  <span className="px-2">Ingredients</span>
                  <span className="px-2">Sale</span>
                  <span className="px-2">Cost</span>
                  <span />
                </div>
              )}
              <SortableContext items={dishIds} strategy={verticalListSortingStrategy}>
                {section.dishes.map((dish, i) => (
                  <DishRow
                    key={i}
                    id={`dish-${sectionIndex}-${i}`}
                    dish={dish}
                    onChange={(patch) => updateDish(i, patch)}
                    onRemove={() => setConfirmRemoveDishIdx(i)}
                    onEnter={() => {}}
                    autoFocus={false}
                    commentCount={dish.id ? (comments[dish.id] ?? []).filter((c) => !c.resolved).length : 0}
                    onOpenComments={() => dish.id && onOpenComments(dish.id)}
                  />
                ))}
              </SortableContext>
            </div>
          ) : (
            <SortableContext items={dishIds} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {section.dishes.map((dish, i) => (
                  <DishCard
                    key={i}
                    id={`dish-${sectionIndex}-${i}`}
                    dish={dish}
                    onChange={(patch) => updateDish(i, patch)}
                    onRemove={() => setConfirmRemoveDishIdx(i)}
                    commentCount={dish.id ? (comments[dish.id] ?? []).filter((c) => !c.resolved).length : 0}
                    onOpenComments={() => dish.id && onOpenComments(dish.id)}
                  />
                ))}
              </div>
            </SortableContext>
          )}

          {/* Quick-add dish input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Type a dish name and press Enter to add…"
              value={newDishName}
              onChange={(e) => setNewDishName(e.target.value)}
              onKeyDown={handleNewDishKeyDown}
              className="w-full rounded-lg border border-dashed border-border bg-card px-3 py-2 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-0"
            />
            <button
              type="button"
              onClick={() => {
                if (newDishName.trim()) {
                  addDish(newDishName.trim());
                  setNewDishName('');
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

  const [name, setName] = useState('');
  const [sections, setSections] = useState<SketchSection[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionIndex, setNewSectionIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [previewMode, setPreviewMode] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [comments, setComments] = useState<SketchComments>({});
  const [activeDishId, setActiveDishId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(true);

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

      // Lazily assign stable UUIDs to any dishes that lack one
      const hadMissingIds = (sketch.sections ?? []).some((s) =>
        s.dishes.some((d) => !d.id),
      );
      const sectionsWithIds = (sketch.sections ?? []).map((s) => ({
        ...s,
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
      { onSuccess: () => toast.success('Menu saved') },
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

    if (activeId.startsWith('section-') && overId.startsWith('section-')) {
      const fromIdx = parseInt(activeId.split('-')[1]);
      const toIdx = parseInt(overId.split('-')[1]);
      setSections((prev) => arrayMove(prev, fromIdx, toIdx));
    } else if (activeId.startsWith('dish-') && overId.startsWith('dish-')) {
      const [, activeSec, activeDish] = activeId.split('-').map(Number);
      const [, overSec, overDish] = overId.split('-').map(Number);
      if (activeSec === overSec) {
        setSections((prev) => {
          const next = [...prev];
          next[activeSec] = {
            ...next[activeSec],
            dishes: arrayMove(next[activeSec].dishes, activeDish, overDish),
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
    }
  };

  const updateSection = (i: number, patch: Partial<SketchSection>) => {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
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
          onClick={() => router.push('/menu-sketch')}
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
            onChange={(e) => setName(e.target.value)}
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
          <MenuSketchPreview name={name} sections={sections} comments={comments} onOpenComments={setActiveDishId} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="mx-auto max-w-4xl px-6 py-8 space-y-4">
              {/* Sections */}
              <SortableContext
                items={sections.map((_, i) => `section-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                {sections.map((section, i) => (
                  <SectionCard
                    key={i}
                    id={`section-${i}`}
                    sectionIndex={i}
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
      {activeDishId && (() => {
        const activeDish = sections.flatMap((s) => s.dishes).find((d) => d.id === activeDishId);
        if (!activeDish) return null;
        return (
          <DishCommentsModal
            dishName={activeDish.name}
            dishComments={comments[activeDishId] ?? []}
            onClose={() => setActiveDishId(null)}
            onChange={(updated) => handleDishCommentChange(activeDishId, updated)}
          />
        );
      })()}
    </div>
  );
}
