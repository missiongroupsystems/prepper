# Plan 19: Menu Sketch Canvas

## Context

The existing `/menu` implementation is a structured, recipe-linked menu builder. This plan adds a **separate, parallel feature** — a freeform, Canva-like canvas for chefs to quickly brainstorm menu layouts. It does **not** touch the existing menu implementation.

The feature lives at `/menu-sketch` and stores layout data as JSON blobs rather than relational rows, enabling a fully freeform block-based canvas experience.

---

## Overview

### Key use case
Chefs want to quickly sketch out a menu layout — similar to Canva — without needing to link to actual recipes. They drag, style, and position content blocks on an A4-like canvas.

### What gets built
1. **New backend table** `menus_sketch` with JSON block arrays
2. **New CRUD API** at `/api/v1/menu-sketches`
3. **List page** `/menu-sketch` — shows all sketches, with a "New Menu" button
4. **Canvas editor** `/menu-sketch/[id]` — the Canva-like editing experience
5. **Nav update** — replace `/menu` with `/menu-sketch` in `TopNav.tsx`

---

## Data Model

### `menus_sketch` table (new)

| Field | Type | Notes |
|---|---|---|
| `id` | int PK | auto-increment |
| `version` | int | starts at 1, incremented on fork |
| `name` | str | default: `"Untitled Menu"` |
| `sections` | JSON | array of `SketchBlock` |
| `dishes` | JSON | array of `SketchBlock` |
| `ingredients` | JSON | array of `SketchBlock` |
| `allergens` | JSON | array of `SketchBlock` |
| `prices` | JSON | array of `SketchBlock` |
| `menu_name_block` | JSON | single block (position + style only, content = `name`) |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### `SketchBlock` shape (stored in JSON arrays)

```json
{
  "id": "uuid-string",
  "content": "New section",
  "x": 100,
  "y": 200,
  "font": "sans-serif",
  "color": "#000000",
  "fontSize": 16,
  "fontWeight": "normal"
}
```

The `menu_name_block` has the same shape but no `content` field — its display text comes from the top-level `name` field.

---

## Backend

### 1. New model — `backend/app/models/menu_sketch.py`

New file with:
- `MenuSketch` — the table model (`__tablename__ = "menus_sketch"`)
- `MenuSketchCreate` — for POST (name optional, defaults to `"Untitled Menu"`)
- `MenuSketchUpdate` — for PATCH (all fields optional)
- `MenuSketchRead` — response schema (all fields including parsed JSON)

JSON block arrays stored as `TEXT` in SQLite (auto-serialized via `sa_column` / `JSON` type). The `SketchBlock` shape is validated as a `list[dict]` via Pydantic.

### 2. New service — `backend/app/domain/menu_sketch_service.py`

Methods:
- `list_sketches() → list[MenuSketch]`
- `get_sketch(id) → MenuSketch | None`
- `create_sketch(data: MenuSketchCreate) → MenuSketch` — initialises all JSON fields as `[]`, `menu_name_block` as `{}`
- `update_sketch(id, data: MenuSketchUpdate) → MenuSketch | None`
- `fork_sketch(id) → MenuSketch | None` — copies all fields, increments `version`

No soft-delete needed per spec (not mentioned).

### 3. New router — `backend/app/api/menu_sketches.py`

Endpoints (no auth required per spec — "Permissions: None"):

| Method | Path | Description |
|---|---|---|
| `GET` | `/menu-sketches` | List all sketches |
| `GET` | `/menu-sketches/{id}` | Get single sketch |
| `POST` | `/menu-sketches` | Create new sketch |
| `PATCH` | `/menu-sketches/{id}` | Update sketch (name, blocks, etc.) |
| `POST` | `/menu-sketches/{id}/fork` | Fork → new version |

### 4. Register router in `backend/app/main.py`

Mount the new router at `/api/v1/menu-sketches`.

### 5. Alembic migration

New migration file creating the `menus_sketch` table.

---

## Frontend

### 1. Types — `frontend/src/lib/types/index.ts`

Add:

```typescript
export interface SketchBlock {
  id: string;
  content: string;
  x: number;
  y: number;
  font?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
}

export interface MenuNameBlock {
  x: number;
  y: number;
  font?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
}

export interface MenuSketch {
  id: number;
  version: number;
  name: string;
  sections: SketchBlock[];
  dishes: SketchBlock[];
  ingredients: SketchBlock[];
  allergens: SketchBlock[];
  prices: SketchBlock[];
  menu_name_block: MenuNameBlock;
  created_at: string;
  updated_at: string;
}
```

### 2. API calls — `frontend/src/lib/api.ts`

Add:
- `getMenuSketches()` → `GET /menu-sketches`
- `getMenuSketch(id)` → `GET /menu-sketches/{id}`
- `createMenuSketch(data?)` → `POST /menu-sketches`
- `updateMenuSketch(id, data)` → `PATCH /menu-sketches/{id}`
- `forkMenuSketch(id)` → `POST /menu-sketches/{id}/fork`

### 3. Hooks — `frontend/src/lib/hooks/useMenuSketches.ts`

TanStack Query hooks:
- `useMenuSketches()` — query for list
- `useMenuSketch(id)` — query for single
- `useCreateMenuSketch()` — mutation, invalidates list
- `useUpdateMenuSketch()` — mutation with optimistic update, debounced autosave
- `useForkMenuSketch()` — mutation, invalidates list, navigates to new sketch

### 4. List page — `frontend/src/app/menu-sketch/page.tsx`

- Displays all menu sketches in a card/list layout (consistent with other list pages)
- Each card shows: name, version number, last updated
- "New Menu" button → calls `createMenuSketch()` then navigates to `/menu-sketch/[id]`
- Clicking a card navigates to `/menu-sketch/[id]`

### 5. Canvas editor — `frontend/src/app/menu-sketch/[id]/page.tsx`

**Top bar** (fixed, above the canvas):
- Editable menu name field (inline edit → triggers `updateMenuSketch`)
- "Add block" buttons: `+ Section`, `+ Dish`, `+ Ingredient`, `+ Allergen`, `+ Price`
- "Fork" button → calls `forkMenuSketch`, navigates to new sketch
- "Save" button (or autosave indicator)

**Canvas area**:
- A4-proportioned white canvas (~794px × 1123px) with a subtle page shadow on a grey background
- If a `menu_name_block` exists, renders it at its stored position; if not, places it at `(20, 20)` by default
- All blocks rendered as absolutely-positioned elements within the canvas
- Each block has:
  - A grip cursor (draggable)
  - An inline-editable text area (except menu name block — text is read-only, mirrors the top-bar name)
  - A small style toolbar appearing on focus: font family selector, colour picker, font size
  - An `×` remove button (top-right corner), hidden on menu name block

**Block dragging**: Use `pointer` events (`onPointerDown` / `onPointerMove` / `onPointerUp`) for drag — no additional library needed. On drop, update block's `x`/`y` in local state; debounce-save to backend.

**Autosave**: Any content/position/style change debounces 800ms then calls `updateMenuSketch`.

**Initial content per block type**:
- sections → `"New section"`
- dishes → `"New dish"`
- ingredients → `"New ingredient"`
- allergens → `"New allergen"`
- prices → `"$0"` (the `$` prefix is non-editable; only the numeric part is editable)

### 6. Nav update — `frontend/src/components/layout/TopNav.tsx`

Change line:
```ts
{ href: '/menu', label: 'Menu', icon: UtensilsCrossed },
```
to:
```ts
{ href: '/menu-sketch', label: 'Menu', icon: UtensilsCrossed },
```

No other changes to the nav.

---

## Files to Create

### Backend
- `backend/app/models/menu_sketch.py` — new model file
- `backend/app/domain/menu_sketch_service.py` — new service file
- `backend/app/api/menu_sketches.py` — new router file
- `backend/alembic/versions/<hash>_add_menus_sketch_table.py` — migration

### Frontend
- `frontend/src/app/menu-sketch/page.tsx` — list page
- `frontend/src/app/menu-sketch/[id]/page.tsx` — canvas editor page
- `frontend/src/lib/hooks/useMenuSketches.ts` — query hooks

## Files to Modify

### Backend
- `backend/app/models/__init__.py` — export new models
- `backend/app/domain/__init__.py` — export new service
- `backend/app/main.py` — mount new router

### Frontend
- `frontend/src/lib/types/index.ts` — add new interfaces
- `frontend/src/lib/api.ts` — add new API functions
- `frontend/src/lib/hooks/index.ts` — re-export new hooks
- `frontend/src/components/layout/TopNav.tsx` — update nav href

---

## Out of Scope

- Auth/permissions (spec says "Permissions: None")
- Connecting sketch blocks to actual Recipe records
- Export/print to PDF
- Existing `/menu` implementation — leave untouched
