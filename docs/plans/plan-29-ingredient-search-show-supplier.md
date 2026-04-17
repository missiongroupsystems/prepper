# Plan 29 — Ingredient Search: Show Supplier in Result Row

## Source
Notion page: https://www.notion.so/345ca9b8c2ee80abbaf7cf8a13eb0c78

## Problem
The ingredient search result row shows **category** in its metadata slot. Preppers need to identify the supplier before committing an ingredient to a recipe. Without it, they must add the ingredient first, navigate to the detail view, check the supplier, and remove it if wrong — an inefficient, destructive loop.

## Decision
Replace the category label with supplier name(s) in the ingredient search result row. Category information remains accessible on the ingredient detail page.

---

## Part 1 — Backend: Include supplier names in ingredient list response

### What changes

#### 1a. `IngredientListRead` DTO — add `supplier_names` field
File: `backend/app/models/ingredient.py`

Add a new field to the slim list DTO used by the paginated list endpoint:

```python
class IngredientListRead(SQLModel):
    id: int
    name: str
    base_unit: str
    cost_per_base_unit: float | None
    is_active: bool
    is_halal: bool
    category: str | None          # existing
    category_id: int | None       # existing
    source: str | None            # existing
    master_ingredient_id: int | None  # existing
    supplier_names: list[str] = []    # NEW — ordered by is_preferred desc, then name asc
    supplier_is_archived: list[bool] = []  # NEW — parallel array; True = soft-deleted supplier
```

> The two parallel lists (`supplier_names`, `supplier_is_archived`) are indexed in the same order so the frontend knows which names are archived without a separate lookup.

#### 1b. `ingredient_service.py` — populate supplier names in `list_paginated_with_count()`
File: `backend/app/domain/ingredient_service.py`

After fetching the paginated ingredient IDs, do a **single batch query** to avoid N+1:

```python
# Batch fetch supplier names for all returned ingredient IDs
from app.models.supplier_ingredient import SupplierIngredient as SI
from app.models.supplier import Supplier

ingredient_ids = [row.id for row in rows]

supplier_rows = session.exec(
    select(SI.ingredient_id, Supplier.name, Supplier.is_active)
    .join(Supplier, SI.supplier_id == Supplier.id)
    .where(SI.ingredient_id.in_(ingredient_ids))
    .order_by(SI.is_preferred.desc(), Supplier.name)
).all()

# Group by ingredient_id
from collections import defaultdict
supplier_map: dict[int, list[tuple[str, bool]]] = defaultdict(list)
for ing_id, sup_name, sup_active in supplier_rows:
    supplier_map[ing_id].append((sup_name, not sup_active))  # is_archived = not is_active

# Build IngredientListRead with supplier_names
reads = []
for row in rows:
    names, archived = zip(*supplier_map[row.id]) if supplier_map[row.id] else ([], [])
    reads.append(IngredientListRead(
        **row.model_dump(),
        supplier_names=list(names),
        supplier_is_archived=list(archived),
    ))
```

> Uses one extra SQL query per page load (not per ingredient), so no latency regression (R8).

### Acceptance criteria
1. `GET /ingredients` response items include `supplier_names: string[]` and `supplier_is_archived: boolean[]` in the same order.
2. An ingredient with no supplier returns `supplier_names: []`.
3. An ingredient with multiple suppliers returns all names ordered preferred-first, then alphabetically.
4. An archived supplier's name is included with `supplier_is_archived[i] = true`.
5. No change to existing fields (category, is_active, etc.).
6. Response latency not significantly affected — supplier data loaded in a single batch query.

### Tests to add
File: `backend/tests/test_ingredients.py`
- `test_list_includes_supplier_names` — create ingredient with supplier, assert `supplier_names` in list response.
- `test_list_no_supplier_returns_empty_array` — ingredient with no supplier → `supplier_names: []`.
- `test_list_archived_supplier_flagged` — soft-delete supplier, assert `supplier_is_archived[i] = true` for that name.
- `test_list_multiple_suppliers_ordered` — preferred supplier appears first.

---

## Part 2 — Frontend: Render supplier names in ingredient search row

### What changes

#### 2a. Update `Ingredient` type
File: `frontend/src/types/index.ts`

```typescript
export interface Ingredient {
  // ... existing fields ...
  supplier_names?: string[];
  supplier_is_archived?: boolean[];
}
```

#### 2b. Update `IngredientListRow` component
File: `frontend/src/components/ingredients/IngredientListRow.tsx`

Replace the category badge (lines ~65–67) with supplier name(s):

```tsx
{/* Supplier names — replace category badge */}
{ingredient.supplier_names && ingredient.supplier_names.length > 0 ? (
  <span title={ingredient.supplier_names.join(', ')} className="text-sm text-muted-foreground">
    {ingredient.supplier_names.map((name, i) => (
      <span
        key={i}
        className={ingredient.supplier_is_archived?.[i] ? 'line-through' : ''}
      >
        {name.length > 10 ? `${name.slice(0, 10)}…` : name}
        {i < ingredient.supplier_names!.length - 1 ? ', ' : ''}
      </span>
    ))}
  </span>
) : (
  <span className="text-sm text-muted-foreground">—</span>
)}
```

- Truncation rule: names longer than 10 characters → first 10 chars + `…` (R5).
- Full supplier list visible on hover via `title` attribute (R2).
- Archived supplier name rendered with `line-through` (R6).
- No supplier → show `—` (R3).
- Left-aligned (matches existing badge alignment).

#### 2c. Update menu-sketch ingredient search dropdown
File: `frontend/src/app/menu-sketch/[id]/page.tsx` (lines ~982–1013)

The suggestion list currently renders only the ingredient name. Add a secondary muted line with supplier names:

```tsx
<div className="flex flex-col">
  <span>{ingredient.name}</span>
  {ingredient.supplier_names && ingredient.supplier_names.length > 0 && (
    <span className="text-xs text-muted-foreground">
      {ingredient.supplier_names
        .map((n) => (n.length > 10 ? `${n.slice(0, 10)}…` : n))
        .join(', ')}
    </span>
  )}
</div>
```

- No `—` fallback in the dropdown (space is tight; absence of the line communicates "no supplier").

#### 2d. Remove category from `IngredientListRow` (R7)
Category info is retained on the ingredient detail page (`/ingredients/[id]`) — no change there. The `category` field may be removed from the row badge or left hidden. Prefer removal to avoid stale information visible to users.

### Acceptance criteria
1. Ingredient search result rows show supplier name(s) instead of the category badge.
2. Supplier name longer than 10 characters is shown as `Sin Hin Cho…` (left-aligned).
3. Multiple suppliers shown comma-separated on one line; full list visible on hover.
4. Ingredient with no supplier shows `—` in the row (not in the menu-sketch dropdown).
5. Archived supplier name displayed with strikethrough.
6. Category information removed from the search row; still visible on `/ingredients/[id]`.
7. Supplier names visible in the menu-sketch ingredient suggestion dropdown below the ingredient name.
8. No visual regression on existing ingredient list, recipe builder, or supplier pages.

### Files summary

| File | Change |
|------|--------|
| `backend/app/models/ingredient.py` | Add `supplier_names`, `supplier_is_archived` to `IngredientListRead` |
| `backend/app/domain/ingredient_service.py` | Batch-load supplier names in `list_paginated_with_count()` |
| `backend/tests/test_ingredients.py` | 4 new tests for supplier name inclusion |
| `frontend/src/types/index.ts` | Add `supplier_names?`, `supplier_is_archived?` to `Ingredient` |
| `frontend/src/components/ingredients/IngredientListRow.tsx` | Replace category badge with supplier names |
| `frontend/src/app/menu-sketch/[id]/page.tsx` | Add supplier name line to suggestion dropdown items |
