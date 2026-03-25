# Plan 20 Part 2: New Content Tabs

## Goal

Implement two new content areas introduced as tab stubs in Part 1:

1. **Products tab** on `/ingredients` — paginated table of supplier ingredients
2. **Users tab** on `/settings` — table of all registered users

No new database tables or migrations are introduced in this part.

---

## 1. Products Tab on `/ingredients`

### Data source

Products are sourced from the existing `supplier_ingredients` table joined with `ingredients` and `suppliers`. The existing API endpoint `GET /api/v1/suppliers/{id}/ingredients` returns data per supplier; a new backend endpoint is needed to list all supplier ingredients in one call.

### 1a. New backend endpoint

**File:** `backend/app/api/supplier_ingredients.py` (or add to existing `ingredients.py`)

```
GET /api/v1/supplier-ingredients
```

Query params: `page` (int, default 1), `page_size` (int, default 20), `search` (optional string — matched against product/ingredient name or SKU).

Response shape (list + pagination metadata):
```json
{
  "items": [
    {
      "id": 1,
      "ingredient_id": 5,
      "ingredient_name": "Tomato",
      "category_name": "Vegetables",
      "sku": "TOM-001",
      "supplier_id": 3,
      "supplier_name": "FreshCo",
      "unit": "kg",
      "price_per_pack": 12.50
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 20
}
```

### 1b. Frontend API helper

**File:** `frontend/src/lib/api.ts`

```ts
export async function getSupplierIngredients(params: {
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<SupplierIngredientsPage>
```

### 1c. TanStack Query hook

**File:** `frontend/src/lib/hooks/useSupplierIngredients.ts`

```ts
export function useSupplierIngredientsPaginated(params: {
  page: number;
  pageSize: number;
  search: string;
})
```

Uses the existing pagination pattern from `useCategoriesPaginated`.

### 1d. ProductsTab component

**File:** `frontend/src/components/ingredients/ProductsTab.tsx` *(new)*

A paginated table with the following columns:

| Column | Source | Behaviour |
|--------|--------|-----------|
| Product Name | `ingredient_name` | Clickable → `/ingredients/[ingredient_id]` |
| Ingredient | `category_name` | Static label |
| SKU | `sku` | Static label |
| Supplier | `supplier_name` | Clickable → `/suppliers/[supplier_id]` |
| Unit | `unit` | Static label |
| Price | `price_per_pack` | Formatted as currency |

- Uses the existing `<Pagination>` component for page controls
- Uses existing `<SearchInput>` for filtering
- Uses existing `<Skeleton>` for loading state
- Tags column is **omitted** (added in Part 3)

### 1e. Wire into ingredients page

**File:** `frontend/src/app/ingredients/page.tsx`

- Add `{ id: 'products', label: 'Products' }` as the first entry in `INGREDIENT_TABS`
- When tab is `products`, render `<ProductsTab />`
- Update `IngredientTab` type in `frontend/src/lib/store.tsx` to include `'products'`

---

## 2. Users Tab on `/settings`

### Data source

Existing `GET /api/v1/users` endpoint (or `GET /api/v1/admin/users`). Check which endpoint already returns a user list; use that without adding a new endpoint.

### 2a. Frontend API helper

**File:** `frontend/src/lib/api.ts`

Add a `getUsers()` function if one does not already exist, returning `User[]`.

### 2b. TanStack Query hook

**File:** `frontend/src/lib/hooks/useUsers.ts` *(add or update)*

```ts
export function useUsers(): { data: User[]; isLoading: boolean }
```

### 2c. UsersTab component

**File:** `frontend/src/components/settings/UsersTab.tsx` *(new)*

A table with columns:

| Column | Source |
|--------|--------|
| Name | `username` |
| Email | `email` |
| Role | `user_type` displayed as a badge (`admin` / `normal`) |
| Manager | boolean flag displayed as a checkbox (read-only) |

- Read-only display; no edit actions in this tab
- Uses existing `<Skeleton>` for loading state
- Pagination if the user list can be large (follow existing pattern)

### 2d. Wire into settings page

**File:** `frontend/src/app/settings/page.tsx`

Replace the "Coming in Part 2" stub with `<UsersTab />`.

---

## Verification

1. Products tab renders a paginated table; search filters results; clicking Product Name navigates to the ingredient detail page; clicking Supplier navigates to the supplier detail page.
2. Users tab shows all registered users with correct role badges.
3. Both tabs respect loading and empty states.
4. `npm run build` and `npm run lint` pass with no errors.
