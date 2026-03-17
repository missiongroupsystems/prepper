# Plan 17: FMH Import Endpoints (HTTP API)

## Context

The existing plan-14 documents a CLI seed script (`scripts/seed_fmh.py`) for loading FMH data. This plan adds two HTTP import endpoints so users can trigger imports from the UI. The key design principle: **all file parsing and in-memory mapping must complete before any DB writes occur**. If validation or mapping fails at any point, nothing is written to the database.

---

## Overview

Two new endpoints:
1. `POST /api/v1/suppliers/fmh-import` — imports suppliers + codes (Steps 1–2)
2. `POST /api/v1/ingredients/fmh-import` — imports outlets, categories, ingredients, relations (Steps 3–6), requires suppliers to be present first

---

## Backend Changes

### 1. Add `openpyxl` dependency

**File:** `backend/pyproject.toml`

Add `openpyxl` to the `[project] dependencies` list.

---

### 2. New service: `FMHImportService`

**New file:** `backend/app/domain/fmh_import_service.py`

#### Response type

```python
class FMHImportResult(SQLModel):
    suppliers_created: int = 0
    suppliers_updated: int = 0     # code enriched on existing suppliers
    outlets_created: int = 0
    categories_created: int = 0
    ingredients_created: int = 0
    supplier_ingredients_created: int = 0
    outlet_supplier_ingredients_created: int = 0
    warnings: list[str] = []
```

---

#### `import_suppliers(session, suppliers_wb, pricings_wb) -> FMHImportResult`

**Phase 1 — Map (no DB writes)**

1. Read `Suppliers` sheet from `suppliers_wb`
   - Expected columns: `Supplier name`, `Phone number`, `Email Address`, `Shipping company name`, `Shipping address`
   - For each non-blank row, build a `dict` keyed by `Supplier name`:
     ```python
     mapped: dict[str, dict] = {
       row["Supplier name"]: {
         "name": row["Supplier name"],
         "phone_number": row["Phone number"] or None,
         "email": row["Email Address"] or None,
         "shipping_company_name": row["Shipping company name"] or None,
         "address": row["Shipping address"] or None,
         "code": None,  # filled in next step
       }
     }
     ```

2. Read `Sponsoredsupplierproducts` sheet from `pricings_wb`
   - Expected columns: `Supplier`, `Product code (Do not edit this field, this is for your reference)`
   - For each non-blank row: extract code prefix (split product code on `-`, take first segment)
   - If `row["Supplier"]` is in `mapped` and `mapped[name]["code"]` is still `None`, set `mapped[name]["code"] = prefix`
   - If supplier name not in `mapped`: append to `warnings` and skip

At this point, `mapped` is a complete dict of supplier shapes with codes merged in. **No DB writes have happened.**

**Phase 2 — Upsert (DB writes begin here)**

3. For each supplier shape in `mapped`:
   - Query DB for existing supplier by `name`
   - If not found: create new `Supplier` → increment `suppliers_created`
   - If found and `code` differs: update `supplier.code` → increment `suppliers_updated`
   - Commit after all rows

4. Return `FMHImportResult`

---

#### `import_ingredients(session, products_wb) -> FMHImportResult`

**Phase 0 — Supplier check (guard)**

- Query DB for all `Supplier` records that have `code IS NOT NULL`
- If none: raise `ValueError("No suppliers with codes found. Import suppliers first.")`
- Build `supplier_by_code: dict[str, Supplier]`

**Phase 1 — Map (no DB writes)**

Read the default sheet from `products_wb`.
Expected columns: `Product code`, `Product name`, `Tags`, `Price`, `Branch`

1. **Map outlets**: iterate all rows, collect unique branch strings (split on `,`, strip whitespace). Build `outlet_names: set[str]`.

2. **Map categories**: collect unique `Tags` values. Build `category_names: set[str]`.

3. **Map ingredients**: deduplicate by `Product code`. For each unique code:
   ```python
   pack_size, base_unit = _parse_pack_from_name(row["Product name"])
   ingredient_shapes[product_code] = {
     "name": row["Product name"],
     "base_unit": base_unit,
     "cost_per_base_unit": float(row["Price"]) / pack_size,
     "tag": row["Tags"],
     "source": "fmh",
   }
   ```

4. **Map supplier-ingredient links**: for each row (NOT deduplicated), extract code prefix from product code. If prefix not in `supplier_by_code`: append warning and skip. Otherwise build:
   ```python
   si_shapes[product_code] = {
     "supplier_code_prefix": prefix,
     "sku": product_code,
     "pack_size": pack_size,
     "pack_unit": base_unit,
     "price_per_pack": float(row["Price"]),
     "currency": "SGD",
     "source": "fmh",
     "branches": [b.strip() for b in row["Branch"].split(",")],
   }
   ```

At this point all data is fully mapped in memory. **No DB writes have happened.**

**Phase 2 — Upsert (DB writes begin here)**

5. **Outlets**: for each outlet name in `outlet_names`, upsert `Outlet` (`name=branch`, `code=None`, `outlet_type=brand`). Build `outlet_by_name: dict[str, Outlet]`. Flush.

6. **Categories**: for each tag in `category_names`, upsert `Category` (skip if name already exists). Build `category_by_tag: dict[str, Category]`. Flush.

7. **Ingredients**: for each ingredient shape, upsert `Ingredient` (skip if name already exists). Link `category_id` via `category_by_tag[shape["tag"]]`. Build `ingredient_by_product_code: dict[str, Ingredient]`. Flush.

8. **SupplierIngredient + OutletSupplierIngredient**: for each SI shape:
   - Look up `supplier = supplier_by_code[prefix]`
   - Look up `ingredient = ingredient_by_product_code[product_code]`
   - Upsert `SupplierIngredient` keyed by `sku` (create if not exists). Flush for ID.
   - For each branch: upsert `OutletSupplierIngredient` (skip if pair already exists).

9. Commit. Return `FMHImportResult`.

**`_parse_pack_from_name(name: str) -> tuple[float, str]`**

Port directly from seed script. Regex extracts quantity+unit token. Units normalised to `kg | g | l | ml | pcs`. Falls back to `(1.0, "pcs")`.

---

### 3. New endpoints in existing routers

**File:** `backend/app/api/suppliers.py`

```python
@router.post("/fmh-import", response_model=FMHImportResult)
async def import_suppliers_fmh(
    suppliers_file: UploadFile = File(...),
    pricings_file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
```

- Admin-only (return 403 if not admin)
- Validate both files are `.xlsx` by filename extension (return 422 if not)
- Load both workbooks: `openpyxl.load_workbook(io.BytesIO(await file.read()))`
- Call `FMHImportService.import_suppliers(session, suppliers_wb, pricings_wb)`
- Return result

**File:** `backend/app/api/ingredients.py`

```python
@router.post("/fmh-import", response_model=FMHImportResult)
async def import_ingredients_fmh(
    products_file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
```

- Admin-only (return 403 if not admin)
- Validate `.xlsx`
- Call `FMHImportService.import_ingredients(session, products_wb)`
- Catch `ValueError` → return `HTTPException(status_code=400, detail=str(e))`
- Return result

---

## Frontend Changes

### 4. Add `FMHImportResult` type

**File:** `frontend/src/types/index.ts`

```typescript
export interface FMHImportResult {
  suppliers_created: number
  suppliers_updated: number
  outlets_created: number
  categories_created: number
  ingredients_created: number
  supplier_ingredients_created: number
  outlet_supplier_ingredients_created: number
  warnings: string[]
}
```

### 5. Add API methods

**File:** `frontend/src/lib/api.ts`

Add a `fetchApiFormData` helper (no Content-Type header so browser sets multipart boundary), then:

```typescript
export async function importSuppliersFMH(suppliersFile: File, pricingsFile: File): Promise<FMHImportResult> {
  const form = new FormData()
  form.append('suppliers_file', suppliersFile)
  form.append('pricings_file', pricingsFile)
  return fetchApiFormData<FMHImportResult>('/suppliers/fmh-import', { method: 'POST', body: form })
}

export async function importIngredientsFMH(productsFile: File): Promise<FMHImportResult> {
  const form = new FormData()
  form.append('products_file', productsFile)
  return fetchApiFormData<FMHImportResult>('/ingredients/fmh-import', { method: 'POST', body: form })
}
```

### 6. `FMHSupplierImportModal` component

**New file:** `frontend/src/components/suppliers/FMHSupplierImportModal.tsx`

Uses existing `Modal` component. Structure:
- Two file inputs (hidden `<input type="file" accept=".xlsx">`), each with a styled button trigger:
  - "Suppliers file" → binds to `Suppliers.xlsx`
  - "Supplier Pricings file" → binds to `SponsoredSupplierPricings.xlsx`
- Filename label below each input when file is selected
- "Import" button disabled until both files selected; shows "Importing..." during request
- On success: show result summary (`X suppliers created, Y codes updated`) + warnings list if any
- On error: show error message inline
- Footer: Cancel + Import buttons

### 7. `FMHIngredientImportModal` component

**New file:** `frontend/src/components/ingredients/FMHIngredientImportModal.tsx`

Same pattern. Single file input for `ProductList.xlsx`. On 400 error, show: _"Suppliers must be imported first. Go to the Suppliers page and run the FMH supplier import."_

On success: show full summary counts + warnings.

### 8. Wire modals into pages

**File:** `frontend/src/app/suppliers/page.tsx`
- State: `const [showFMHImport, setShowFMHImport] = useState(false)`
- Add "Import (FMH)" button in toolbar (outline variant, beside "Add Supplier")
- Render `<FMHSupplierImportModal isOpen={showFMHImport} onClose={() => { setShowFMHImport(false); queryClient.invalidateQueries() }} />`

**File:** `frontend/src/app/ingredients/page.tsx`
- Same pattern, only show button on "Ingredients" tab
- On close after success: invalidate ingredients + categories + outlets queries

---

## Critical Files

| File | Action |
|------|--------|
| `backend/pyproject.toml` | Add `openpyxl` |
| `backend/app/domain/fmh_import_service.py` | **New** — all mapping + upsert logic |
| `backend/app/api/suppliers.py` | Add `POST /fmh-import` |
| `backend/app/api/ingredients.py` | Add `POST /fmh-import` |
| `frontend/src/types/index.ts` | Add `FMHImportResult` |
| `frontend/src/lib/api.ts` | Add `fetchApiFormData`, `importSuppliersFMH`, `importIngredientsFMH` |
| `frontend/src/components/suppliers/FMHSupplierImportModal.tsx` | **New** |
| `frontend/src/components/ingredients/FMHIngredientImportModal.tsx` | **New** |
| `frontend/src/app/suppliers/page.tsx` | Add "Import (FMH)" button + modal |
| `frontend/src/app/ingredients/page.tsx` | Add "Import (FMH)" button + modal |

## Existing Code to Reuse

- `Modal`, `Button`, `Input` — `frontend/src/components/ui/`
- `get_current_user`, `get_session` — `backend/app/api/deps.py`
- `Supplier`, `Ingredient`, `Outlet`, `Category`, `SupplierIngredient`, `OutletSupplierIngredient` models — `backend/app/models/`
- `_parse_pack_from_name` — port from `backend/scripts/seed_fmh.py`

---

## Verification

1. **Unit tests** — `backend/tests/test_fmh_import.py`
   - Build mock workbooks in-memory with `openpyxl.Workbook()`
   - Supplier import: creates suppliers, enriches codes, skips duplicates, logs warnings on unmatched names
   - Ingredient import: 400 when no suppliers with codes, creates all entities, skips existing

2. **Manual E2E**
   - `POST /api/v1/suppliers/fmh-import` via Swagger UI with real FMH files
   - Then `POST /api/v1/ingredients/fmh-import`
   - Check response counts match expected rows; verify DB state

3. **Frontend**
   - `npm run build` — no type errors
   - Upload files in UI, confirm summary modal shown
   - Test 400 error path (ingredient import before supplier import)
