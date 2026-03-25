'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useMenuSketch, useUpdateMenuSketch, useForkMenuSketch } from '@/lib/hooks';
import type { SketchSection, SketchDish } from '@/types';
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
} from 'lucide-react';
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
function chunk<T>(arr: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n));
  return result;
}

// ─── Empty factories ──────────────────────────────────────────────────────────
function emptyDish(name = ''): SketchDish {
  return { name, ingredients: [], sales_price: 0, cost_price: 0, description: '' };
}

function emptySection(name = ''): SketchSection {
  return { name, dishes: [] };
}

// ─── Preview components ───────────────────────────────────────────────────────
function DishPreviewCell({ dish }: { dish: SketchDish | undefined }) {
  const costPct =
    dish && dish.sales_price > 0
      ? ((dish.cost_price / dish.sales_price) * 100).toFixed(2) + '%'
      : '—';
  if (!dish) return <div className="px-4 py-3" />;
  return (
    <div className="px-4 py-3 space-y-0.5">
      {/* Prices row (right-aligned) */}
      <div className="flex items-center gap-2">
        <span className="flex-1" />
        <div className="flex shrink-0 gap-4 text-right text-xs tabular-nums">
          <span className="text-zinc-700 dark:text-zinc-300 w-14">
            ${dish.sales_price.toFixed(2)}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 w-14">
            ${dish.cost_price.toFixed(2)}
          </span>
          <span className="text-zinc-400 dark:text-zinc-500 w-12">{costPct}</span>
        </div>
      </div>
      {/* Dish name — full width */}
      <p className="font-semibold text-zinc-900 dark:text-zinc-50 leading-snug">
        {dish.name || '—'}
      </p>
      {/* Ingredients */}
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        <span className="font-semibold">Ingredients:</span>{' '}
        {dish.ingredients.length > 0 ? dish.ingredients.join(', ') : '—'}
      </p>
      {/* Description — always shown */}
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        <span className="font-semibold">Description:</span>{' '}
        {dish.description?.trim() || 'n/a'}
      </p>
    </div>
  );
}

function MenuSketchPreview({ name, sections }: { name: string; sections: SketchSection[] }) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-8 text-sm">
      {name && (
        <h1 className="text-center text-2xl font-bold tracking-wide text-zinc-900 dark:text-zinc-50 uppercase">
          {name}
        </h1>
      )}
      {sections.map((section, si) => {
        const pairs = chunk(section.dishes, 2);
        return (
          <div key={si} className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
            {/* Section header */}
            <div className="text-center font-bold tracking-widest uppercase text-sm py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {section.name || 'Unnamed Section'}
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-2 divide-x divide-zinc-200 dark:divide-zinc-700 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60">
              {[0, 1].map((col) => (
                <div key={col} className="flex items-center gap-2 px-4 py-1.5">
                  <span className="flex-1" />
                  <div className="flex shrink-0 gap-4 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">
                    <span className="w-14">Price</span>
                    <span className="w-14">Cost</span>
                    <span className="w-12">%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* No dishes */}
            {pairs.length === 0 && (
              <div className="px-4 py-4 text-zinc-400 italic text-xs text-center">
                No dishes
              </div>
            )}

            {/* Dish pairs */}
            {pairs.map(([d1, d2], pi) => (
              <div
                key={pi}
                className={`grid grid-cols-2 divide-x divide-zinc-200 dark:divide-zinc-700 ${pi > 0 ? 'border-t border-zinc-200 dark:border-zinc-700' : ''}`}
              >
                <DishPreviewCell dish={d1} />
                <DishPreviewCell dish={d2} />
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
}: {
  id: string;
  dish: SketchDish;
  onChange: (patch: Partial<SketchDish>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [ingredientsText, setIngredientsText] = useState(dish.ingredients.join(', '));

  const prevRef = useRef(dish.ingredients);
  useEffect(() => {
    if (prevRef.current !== dish.ingredients) {
      setIngredientsText(dish.ingredients.join(', '));
      prevRef.current = dish.ingredients;
    }
  }, [dish.ingredients]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-3 cursor-grab touch-none text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="space-y-3 pl-5 pr-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Dish</label>
          <input
            type="text"
            value={dish.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Dish name"
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Ingredients</label>
          <input
            type="text"
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            onBlur={(e) => {
              const ingredients = e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
              onChange({ ingredients });
            }}
            placeholder="e.g. chicken stock, cream, butter"
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Sale price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={dish.sales_price || ''}
              onChange={(e) => onChange({ sales_price: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Cost price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={dish.cost_price || ''}
              onChange={(e) => onChange({ cost_price: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Description</label>
          <textarea
            rows={2}
            value={dish.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Optional dish description…"
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600 resize-y"
          />
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
}: {
  id: string;
  dish: SketchDish;
  onChange: (patch: Partial<SketchDish>) => void;
  onRemove: () => void;
  onEnter: () => void;
  autoFocus?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const nameRef = useRef<HTMLInputElement>(null);
  const [ingredientsText, setIngredientsText] = useState(dish.ingredients.join(', '));

  useEffect(() => {
    if (autoFocus) nameRef.current?.focus();
  }, [autoFocus]);

  const prevRef = useRef(dish.ingredients);
  useEffect(() => {
    if (prevRef.current !== dish.ingredients) {
      setIngredientsText(dish.ingredients.join(', '));
      prevRef.current = dish.ingredients;
    }
  }, [dish.ingredients]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      {/* Main row */}
      <div className="grid grid-cols-[auto_1fr_auto]">
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab touch-none items-center px-2 text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="grid grid-cols-[1fr_1fr_80px_80px] divide-x divide-zinc-100 dark:divide-zinc-800">
          <input
            ref={nameRef}
            type="text"
            placeholder="Dish name"
            value={dish.name}
            onChange={(e) => onChange({ name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onEnter()}
            className="px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-900/10 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-600"
          />
          <input
            type="text"
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
            className="px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-900/10 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-600"
          />
          <input
            type="number"
            placeholder="Sale"
            step="0.01"
            min="0"
            value={dish.sales_price || ''}
            onChange={(e) => onChange({ sales_price: parseFloat(e.target.value) || 0 })}
            className="px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-900/10 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-600"
          />
          <input
            type="number"
            placeholder="Cost"
            step="0.01"
            min="0"
            value={dish.cost_price || ''}
            onChange={(e) => onChange({ cost_price: parseFloat(e.target.value) || 0 })}
            className="px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-900/10 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-600"
          />
        </div>
        <button
          onClick={onRemove}
          className="flex items-center justify-center rounded-tr-lg border-l border-zinc-200 px-2 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:border-zinc-700 dark:hover:bg-red-950/20"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Description sub-row */}
      <div className="border-t border-zinc-100 dark:border-zinc-800">
        <textarea
          rows={2}
          placeholder="Description (optional)"
          value={dish.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full resize-y px-3 py-1.5 text-xs text-zinc-600 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-900/10 dark:bg-zinc-900 dark:text-zinc-400 dark:placeholder-zinc-600"
        />
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
  onEnterInName,
  autoFocusName,
}: {
  id: string;
  sectionIndex: number;
  section: SketchSection;
  viewMode: 'list' | 'card';
  onChange: (patch: Partial<SketchSection>) => void;
  onRemove: () => void;
  onEnterInName: () => void;
  autoFocusName?: boolean;
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
      className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
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
          className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder-zinc-600"
        />
        <span className="text-xs text-zinc-400">
          {section.dishes.length} {section.dishes.length === 1 ? 'dish' : 'dishes'}
        </span>
        <button
          onClick={onRemove}
          className="ml-1 rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          {/* Quick-add dish input */}
          <input
            type="text"
            placeholder="Type a dish name and press Enter to add…"
            value={newDishName}
            onChange={(e) => setNewDishName(e.target.value)}
            onKeyDown={handleNewDishKeyDown}
            className="w-full rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-0 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-zinc-500"
          />

          {/* Dishes */}
          {viewMode === 'list' ? (
            <div className="space-y-1.5">
              {section.dishes.length > 0 && (
                <div className="grid grid-cols-[32px_1fr_1fr_80px_80px_32px] px-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
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
                    onRemove={() => removeDish(i)}
                    onEnter={() => {}}
                    autoFocus={false}
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
                    onRemove={() => removeDish(i)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
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
  const [previewMode, setPreviewMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (sketch) {
      setName(sketch.name);
      setSections(sketch.sections ?? []);
    }
  }, [sketch]);

  const handleSave = () => {
    updateMutation.mutate(
      { id: sketchId, data: { name, sections } },
      { onSuccess: () => toast.success('Menu saved') },
    );
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
    setSections((prev) => prev.filter((_, idx) => idx !== i));
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
      </div>
    );
  }

  if (!sketch) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-zinc-400">
        Sketch not found
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        {/* Back */}
        <button
          onClick={() => router.push('/menu-sketch')}
          className="flex items-center gap-1 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Editable name */}
        {editingName ? (
          <input
            autoFocus
            className="rounded border border-zinc-300 px-2 py-1 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
          />
        ) : (
          <button
            className="text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
            onClick={() => setEditingName(true)}
          >
            {name || 'Untitled Menu'}
          </button>
        )}

        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          v{sketch.version}
        </span>

        <div className="flex-1" />

        {/* View toggle (hidden in preview mode) */}
        {!previewMode && (
          <div className="flex items-center gap-0.5 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-700">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'card'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
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
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {previewMode ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {previewMode ? 'Edit' : 'Preview'}
        </button>

        {/* Fork */}
        <button
          onClick={() => forkMutation.mutate(sketchId)}
          disabled={forkMutation.isPending}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <GitFork className="h-3.5 w-3.5" />
          Fork
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <Save className="h-3.5 w-3.5" />
          {updateMutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Editor body / Preview */}
      <div className="flex-1 overflow-auto">
        {previewMode ? (
          <MenuSketchPreview name={name} sections={sections} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="mx-auto max-w-4xl px-6 py-8 space-y-4">
              {/* New section input at top */}
              <input
                type="text"
                placeholder="Type a section name and press Enter to add…"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={handleNewSectionKeyDown}
                className="w-full rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-zinc-500"
              />

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
                    onEnterInName={() => {
                      const el = document.querySelector<HTMLInputElement>(
                        'input[placeholder*="section name"]',
                      );
                      el?.focus();
                    }}
                    autoFocusName={newSectionIndex === i}
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        )}
      </div>
    </div>
  );
}
