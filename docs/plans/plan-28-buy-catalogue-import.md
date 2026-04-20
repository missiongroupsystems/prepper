# Plan 28 — Buy Catalogue Import

## Context

The `EXPORT_BUY_CATALOGUE` FMH export delivers all data in one sheet with inline supplier name and SKU. Unlike the existing 2-file FMH import (suppliers sheet + products sheet), this format is self-contained — no pre-import step required. This plan adds a single-function import, a template download endpoint, and a "Buy Catalogue" dropdown button on the Ingredients page.

---

## Column Mapping

| Excel Column    | DB Target                           | Notes |
|-----------------|-------------------------------------|-------|
| `Branch Name`   | `Outlet.name`                       | skip-on-duplicate (case-insensitive) |
| `Product Name`  | `Ingredient.name`                   | overwrite when SKU matches |
| `Supplier Name` | `Supplier.name`                     | skip-on-duplicate (case-insensitive) |
| `Sku`           | `SupplierIngredient.sku`            | unique key — overwrite on match |
| SKU prefix      | `Supplier.code`                     | e.g. "HENT" from "HENT-FD-POULTRY-000003"; only set for new suppliers |
| `Category Name` | `Category.name`                     | normalise to `.title()` → skip-on-duplicate |
| `Uom`           | `SupplierIngredient.pack_unit`      | kept as-is (e.g. "PKT", "KG") |
| `Unit`          | `SupplierIngredient.pack_size`      | always 1 in this file |
| `Price`         | `SupplierIngredient.price_per_pack` | float |
| `Currency`      | `SupplierIngredient.currency`       | always "SGD" |
| `Packaging Note`| derive `Ingredient.base_unit` + cost divisor | "500GM / PKT" → base_unit="g", divisor=500 |

---

## Duplicate Handling

| Entity | Strategy | Key |
|---|---|---|
| Ingredient | **Overwrite** | SKU (via SupplierIngredient.sku) → name fallback |
| SupplierIngredient | **Overwrite** | SupplierIngredient.sku |
| Supplier | **Skip** | Supplier.name (case-insensitive) |
| Category | **Skip** | Category.name (case-insensitive) |
| Outlet | **Skip** | Outlet.name (case-insensitive) |
| OutletSupplierIngredient | **Skip** | (si_id, outlet_id) pair |

---

## Backend Changes

### `backend/app/domain/fmh_import_service.py`

- Extended `_UNIT_MAP` with full FMH abbreviation set (`gm`, `gms`, `kgs`, `mls`, `lt`, `ltr`, `pce`, etc.)
- Added `_parse_pack_from_note(note, fallback_name)` — regex match on packaging note, falls back to `_parse_pack_from_name`
- Added `import_buy_catalogue(session, wb)` — two-phase approach:
  - Phase 1: single pass builds in-memory `outlet_names`, `category_keys`, `supplier_shapes`, `ingredient_shapes`, `si_shapes`
  - Phase 2: 1 bulk SELECT + `add_all` + `flush` per entity type; single `session.commit()` at the end

### `backend/app/api/ingredients.py`

- `POST /ingredients/buy-catalogue-import` — admin-only, accepts `.xlsx`, calls `import_buy_catalogue`
- `GET /ingredients/buy-catalogue-template` — returns blank XLSX with correct headers + example row

---

## Frontend Changes

### `frontend/src/lib/api.ts`

- `importIngredientsBuyCatalogue(file)` — `POST /ingredients/buy-catalogue-import`
- `downloadBuyCatalogueTemplate()` — `GET /ingredients/buy-catalogue-template`

### `frontend/src/components/ingredients/BuyCatalogueImportModal.tsx`

- Single file input modal, mirrors `FMHIngredientImportModal`
- On success: shows ingredient/supplier/outlet/category counts; invalidates `ingredients`, `categories`, `outlets`, `suppliers` query keys
- No "suppliers must be imported first" error — self-contained format

### `frontend/src/app/ingredients/page.tsx`

- Added `BuyCatalogueImportModal` state and render
- Added "Buy Catalogue" `DropdownButton` next to "FMH" with Download Template and Import items

---

## Efficiency Guarantees

- 1 SELECT per entity type (bulk `in_()` query)
- 1 `add_all` + `flush` per entity type
- All duplicate checks in-memory after bulk pre-load
- 1 `session.commit()` at end

---

## Verification

1. `pytest backend/tests/` — no regressions
2. Manual: `POST /api/v1/ingredients/buy-catalogue-import` → expect ~914 SIs, 57 suppliers, 1 outlet, ~6 categories
3. `GET /api/v1/ingredients/buy-catalogue-template` → valid XLSX with correct headers
4. `npm run build` — no type errors; upload flow shows toast with counts
