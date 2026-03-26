# Plan 21 — Menu Sketch: Further Feedback

---

## Refined Changes Overview

### `/menu-sketch` (list page)
- Standardise colour scheme to use design-system tokens (`bg-background`, `border-border`, `text-foreground`, etc.) and reuse `Card`, `Button`, `PageHeader` from `@/components/ui`

### `/menu-sketch/[id]` (editor page)

**Overall**
- Default mode on load = **preview** (flip `previewMode` initial state to `true`)
- Add **dish-level comments** panel — right-hand sidebar (always visible regardless of mode), similar to Google Slides
- Add **menu-wide notes** — collapsible rich-text block *below* the menu in both modes; supports bold, underline, strikethrough, italic, links

**Preview mode**
- The `%` column header and per-dish `%` value must match the `font-weight` of `Price` and `Cost` (currently lighter — fix header to `font-semibold`, fix cell value to `font-medium`)
- If a dish has no description (empty/`null`/whitespace), omit the description row entirely — do not render "Description: n/a"

**Edit mode**
- Ingredients field in **card view** (`DishCard`): replace single-line `<input>` with `<textarea rows={2} resize-y />` so long ingredient lists wrap visually
- Ingredients field in **row view** (`DishRow`): switch to `<textarea rows={1} resize-y />` preserving the blur-split-by-comma logic
- Each "quick-add" text box (new section input, new dish input inside a section) gains a visible **Send button** (`<SendHorizonal>` icon from lucide) that triggers the same add action as pressing Enter; applies to both `/menu-sketch` and `/menu-sketch/[id]`

**Colour scheme**
- Both pages currently use raw `zinc-*` classes; replace with design-system tokens throughout to align with the rest of the app

---

## Architecture Decisions

### Save isolation
Comments and notes are stored in **separate columns** on `menus_sketch`. Each save path only touches its own field:

| Action | PATCH payload |
|--------|--------------|
| Edit sections/name | `{ name?, sections? }` |
| Edit comments | `{ comments: … }` |
| Edit notes | `{ notes: … }` |

This prevents any one save from overwriting another field.

### Comments — `comments` JSON column (Alembic migration required)
Comments live in a new `comments` JSON column, keyed by a stable **dish ID**. Each `SketchDish` gains an optional `id` field (UUID string). When a dish is created without an ID, the frontend assigns one via `crypto.randomUUID()`. Existing dishes are assigned IDs when the sketch is first loaded (lazy migration in the frontend `useEffect`).

```typescript
interface SketchComment {
  id: string;          // crypto.randomUUID()
  text: string;
  resolved: boolean;
  created_at: string;  // ISO string
}

// Top-level comments column on the sketch:
// Record<dish_id, SketchComment[]>
type SketchComments = Record<string, SketchComment[]>;

// SketchDish gains:
interface SketchDish {
  id?: string;         // stable UUID — assigned on creation
  name: string;
  ingredients: string[];
  sales_price: number;
  cost_price: number;
  description?: string;
}
```

Save flow: comments state changes → debounced `PATCH /menu-sketches/{id}` with `{ comments }` only.

### Notes — `notes` VARCHAR column (Alembic migration required)
Notes are menu-wide, stored as an **HTML string** (output of Tiptap). A separate `notes` column on `menus_sketch` (nullable, default `null`).

Save flow: notes change → debounced `PATCH /menu-sketches/{id}` with `{ notes }` only.

Rich-text editing uses **Tiptap** (`@tiptap/react` + `@tiptap/pm` + `@tiptap/starter-kit` + `@tiptap/extension-link` + `@tiptap/extension-underline`). Toolbar exposes only: Bold, Italic, Underline, Strikethrough, Link.

---

## Parts

Work is split into five sequential parts. Verify each before starting the next.

---

### Part 1 — Design System Alignment (both pages)

**Goal:** Make both pages visually consistent with the rest of the app by adopting design-system tokens and shared UI components.

**Rules:**
- Replace raw `zinc-*` classes with CSS-variable tokens: `bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `ring-ring`, etc.
- Reuse `Card`, `Button`, `Input`, `Textarea`, `PageHeader`, `Badge` from `@/components/ui` where appropriate
- **Do not change** layout, functionality, or component structure — token replacement only

| File | What to do |
|------|------------|
| `frontend/src/app/menu-sketch/page.tsx` | Token pass + use `Card`, `Button`, `PageHeader` from `@/components/ui` |
| `frontend/src/app/menu-sketch/[id]/page.tsx` | Token pass across top bar, section cards, dish cards, and preview pane |

---

### Part 2 — Preview & Edit Mode Fixes

**Goal:** Five discrete, self-contained fixes in the editor page.

#### 2a — Default mode = preview
In `MenuSketchEditorPage`, change `useState(false)` → `useState(true)` for `previewMode`.

#### 2b — Preview: hide empty descriptions
In `DishPreviewCell`, wrap the description `<p>` in a conditional:
```tsx
{dish.description?.trim() && (
  <p className="text-sm …">
    <span className="font-semibold">Description:</span>{' '}
    {dish.description}
  </p>
)}
```

#### 2c — Preview: % column font weight parity
- Column header `%` span: add `font-semibold` to match `Price` and `Cost` headers
- Per-dish `%` cell value: match the weight of the cost cell (`font-medium` or same class as the cost span)

#### 2d — Edit: ingredients as textarea (card + row view)
- `DishCard`: replace ingredients `<input>` with `<textarea rows={2} className="… resize-y" />`; `onBlur` split-by-comma logic unchanged
- `DishRow`: replace ingredients `<input>` with `<textarea rows={1} className="… resize-y" />`; same blur logic

#### 2e — Edit: Send button on quick-add inputs
Both inputs (new section + new dish) get a Send button:
- Wrap existing `<input>` in a relative container
- Add `<button type="button" onClick={…}><SendHorizonal className="h-3.5 w-3.5" /></button>` right-aligned inside / adjacent to the input
- Button calls the same add logic as the Enter key handler
- Style: small, muted, using border/muted-foreground tokens

**Files:** `frontend/src/app/menu-sketch/[id]/page.tsx` only

---

### Part 3 — Backend: `comments` and `notes` Columns

**Goal:** Add two new columns to `menus_sketch` and expose them through the API. These are the only backend changes in this plan.

#### 3a — Model & schemas (`backend/app/models/menu_sketch.py`)
```python
# New columns
comments: dict = Field(default_factory=dict, sa_column=Column(JSON))
notes: str | None = Field(default=None)
```
Add both to `MenuSketchUpdate` (optional) and `MenuSketchRead`.

#### 3b — Service (`backend/app/domain/menu_sketch_service.py`)
Pass `comments` and `notes` through in create and update paths (same pattern as existing `sections` and `name`).

#### 3c — Alembic migration
```bash
alembic revision --autogenerate -m "add_comments_and_notes_to_menus_sketch"
```
Verify the generated migration adds:
- `comments JSON NOT NULL DEFAULT '{}'` (or equivalent)
- `notes VARCHAR NULL`

on the `menus_sketch` table.

#### 3d — Frontend types (`frontend/src/types/index.ts`)
```typescript
export interface SketchComment {
  id: string;
  text: string;
  resolved: boolean;
  created_at: string;
}

export type SketchComments = Record<string, SketchComment[]>; // keyed by dish id

export interface SketchDish {
  id?: string;          // stable UUID
  name: string;
  ingredients: string[];
  sales_price: number;
  cost_price: number;
  description?: string;
}

export interface MenuSketch {
  id: number;
  version: number;
  name: string;
  sections: SketchSection[];
  comments: SketchComments;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateMenuSketchRequest {
  name?: string;
  sections?: SketchSection[];
  comments?: SketchComments;
  notes?: string | null;
}
```

#### 3e — Frontend API (`frontend/src/lib/api.ts`)
`updateMenuSketch` already spreads the full update object — verify `comments` and `notes` pass through. No structural change needed.

**Files:**
- `backend/app/models/menu_sketch.py`
- `backend/app/domain/menu_sketch_service.py`
- `backend/alembic/versions/<new_migration>.py`
- `frontend/src/types/index.ts`
- `frontend/src/lib/api.ts` (verify only)

---

### Part 4 — Dish Comments Panel

**Goal:** Right-hand sidebar for per-dish commenting, always visible. All four CRUD actions: add, edit, delete (with confirm), resolve.

#### 4a — Layout update (`page.tsx`)
- Wrap the main body in a two-column layout: `grid grid-cols-[1fr_300px] gap-0`
- Left column: existing editor / preview (unchanged)
- Right column: `<CommentsPanel />`
- On narrow viewports (`< lg`), collapse the panel — add a small icon toggle button in the top bar (e.g. `MessageSquare`) that shows/hides the panel via local state

#### 4b — Dish ID assignment
In the `useEffect` that seeds `sections` from `sketch`, lazily assign IDs to dishes that don't have one:
```ts
setSections(
  (sketch.sections ?? []).map(sec => ({
    ...sec,
    dishes: sec.dishes.map(d => ({ ...d, id: d.id ?? crypto.randomUUID() })),
  }))
);
```
After assigning, if any IDs were added, immediately save `sections` so they persist.

#### 4c — Comments state & save
In `MenuSketchEditorPage`:
```ts
const [comments, setComments] = useState<SketchComments>({});

useEffect(() => {
  if (sketch) setComments(sketch.comments ?? {});
}, [sketch]);

// Dedicated save — does NOT touch sections or name
const saveComments = useDebouncedCallback((c: SketchComments) => {
  updateMutation.mutate({ id: sketchId, data: { comments: c } });
}, 600);

const handleCommentsChange = (c: SketchComments) => {
  setComments(c);
  saveComments(c);
};
```

#### 4d — `CommentsPanel` component
Create `frontend/src/app/menu-sketch/[id]/CommentsPanel.tsx`:

```
CommentsPanel
├── For each section
│   └── For each dish (that has ≥1 non-resolved comment, or always listed)
│       ├── Dish name heading
│       ├── List of non-resolved comments
│       │   └── Each: text | timestamp | [pencil] [tick] [trash]
│       │       ├── Pencil → inline textarea edit → Enter/Send saves
│       │       ├── Tick → mark resolved → hides from default view
│       │       └── Trash → ConfirmModal → removes comment
│       └── Add-comment form: <textarea> + Send button (Enter also works)
└── "Show resolved" toggle (bottom of panel) — reveals greyed-out resolved comments
```

Props:
```typescript
interface CommentsPanelProps {
  sections: SketchSection[];
  comments: SketchComments;
  onChange: (comments: SketchComments) => void;
}
```

Use `ConfirmModal` from `@/components/ui` for the delete confirmation.

Tooltips on action icons: "Edit", "Resolve", "Delete" (use `title` attribute).

#### 4e — Preview: comment count badge
In `DishPreviewCell`, if a dish has `id` and there are non-resolved comments for it, show a small count pill (bottom-right of the cell):
```tsx
const count = dish.id ? (comments[dish.id] ?? []).filter(c => !c.resolved).length : 0;
{count > 0 && (
  <span className="absolute bottom-2 right-3 rounded-full bg-zinc-200 px-1.5 text-xs text-zinc-600">
    {count}
  </span>
)}
```
`CommentsPanel` and `DishPreviewCell` both need access to `comments` state — pass it down from the page.

**Files:**
- `frontend/src/app/menu-sketch/[id]/page.tsx`
- `frontend/src/app/menu-sketch/[id]/CommentsPanel.tsx` (new)

---

### Part 5 — Menu Notes (Tiptap)

**Goal:** Collapsible rich-text notes block below the menu, editable in both modes.

#### 5a — Install Tiptap
```bash
cd frontend
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-underline
```

#### 5b — `NotesEditor` component
Create `frontend/src/app/menu-sketch/[id]/NotesEditor.tsx`:

```
NotesEditor
├── Toolbar: B | I | U | S | 🔗
└── EditorContent (min-height 80px)
```

- Uses `useEditor({ extensions: [StarterKit, Underline, Link] })`
- `onUpdate` fires a debounced (500 ms) `onChange(html)` prop call
- Accepts `initialContent?: string | null` — passed as `content` on `useEditor`
- Use design-system tokens for toolbar and editor border

#### 5c — Notes state & save in `page.tsx`
```ts
const [notes, setNotes] = useState<string | null>(null);

useEffect(() => {
  if (sketch) setNotes(sketch.notes ?? null);
}, [sketch]);

const saveNotes = useDebouncedCallback((n: string | null) => {
  updateMutation.mutate({ id: sketchId, data: { notes: n } });
}, 600);

const handleNotesChange = (html: string) => {
  setNotes(html);
  saveNotes(html);
};
```

#### 5d — Collapsible notes section in the layout
Below the main `flex-1 overflow-auto` body, add a notes section **outside** the scroll area (or at the bottom of the scroll area):
```tsx
<div className="shrink-0 border-t border-border">
  <button onClick={() => setNotesOpen(v => !v)} className="…flex items-center gap-2 px-6 py-2 text-sm font-medium">
    {notesOpen ? <ChevronUp /> : <ChevronDown />} Notes
  </button>
  {notesOpen && (
    <div className="px-6 pb-4">
      <NotesEditor initialContent={notes} onChange={handleNotesChange} />
    </div>
  )}
</div>
```
Default state: `notesOpen = true` (expanded, per spec).

**Files:**
- `frontend/package.json`
- `frontend/src/app/menu-sketch/[id]/NotesEditor.tsx` (new)
- `frontend/src/app/menu-sketch/[id]/page.tsx`

---

## Summary of Files to Touch

| File | Parts |
|------|-------|
| `frontend/src/app/menu-sketch/page.tsx` | 1 |
| `frontend/src/app/menu-sketch/[id]/page.tsx` | 1, 2, 4, 5 |
| `frontend/src/app/menu-sketch/[id]/CommentsPanel.tsx` | 4 (new) |
| `frontend/src/app/menu-sketch/[id]/NotesEditor.tsx` | 5 (new) |
| `frontend/src/types/index.ts` | 3 |
| `frontend/src/lib/api.ts` | 3 (verify) |
| `frontend/package.json` | 5 |
| `backend/app/models/menu_sketch.py` | 3 |
| `backend/app/domain/menu_sketch_service.py` | 3 |
| `backend/alembic/versions/<migration>.py` | 3 (new) |

---

## Execution Order

1. **Part 1** — Design token pass (safe, no logic changes)
2. **Part 2** — Five small focused fixes in the editor page
3. **Part 3** — Backend columns + migration + frontend types
4. **Part 4** — Comments panel (depends on Part 3 types + dish IDs)
5. **Part 5** — Notes editor with Tiptap (depends on Part 3 backend)
