# Plan 18: FMH Sample File Export Endpoints

## Context

Plan 17 added HTTP import endpoints for FMH data. This plan adds the companion "export sample" flow so users can download the correctly-formatted template files directly from the UI before running an import. The sample files already exist in Supabase Storage under `prepper/fmh-samples/`.

---

## Overview

Three new GET endpoints serve sample XLSX files from Supabase Storage:

1. `GET /api/v1/suppliers/fmh-sample-supplier` → `Suppliers_sample.xlsx`
2. `GET /api/v1/suppliers/fmh-sample-supplier-pricings` → `SponsoredSupplierPricings_sample.xlsx`
3. `GET /api/v1/ingredients/fmh-sample-items` → `ProductList_sample.xlsx`

Each endpoint fetches the file from Supabase and streams it as an attachment download. Corresponding frontend buttons are placed beside the existing "Import (FMH)" buttons on `/suppliers` and `/ingredients`.

---

## Backend Changes

### 1. Add `download_fmh_sample` to `StorageService`

**File:** `backend/app/domain/storage_service.py`

Add a new async method:

```python
async def download_fmh_sample(self, filename: str) -> bytes:
    """
    Fetch a sample file from Supabase Storage.

    Args:
        filename: Filename within the prepper/fmh-samples/ folder,
                  e.g. "Suppliers_sample.xlsx"

    Returns:
        Raw file bytes.

    Raises:
        StorageError: If the file cannot be fetched.
    """
    path = f"prepper/fmh-samples/{filename}"
    url = (
        f"{self.settings.supabase_url}/storage/v1/object/public/"
        f"{self.settings.supabase_bucket}/{path}"
    )
    client = get_http_client()
    try:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        return response.content
    except httpx.HTTPStatusError as e:
        raise StorageError(
            f"Sample file not found: {filename} "
            f"(status {e.response.status_code})"
        )
    except httpx.HTTPError as e:
        raise StorageError(f"Failed to fetch sample file: {str(e)}")
```

---

### 2. New endpoints in `suppliers.py`

**File:** `backend/app/api/suppliers.py`

```python
from fastapi.responses import Response
from app.domain.storage_service import StorageService, StorageError, is_storage_configured

XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

@router.get("/fmh-sample-supplier")
async def download_fmh_sample_supplier() -> Response:
    if not is_storage_configured():
        raise HTTPException(status_code=503, detail="Storage not configured")
    try:
        data = await StorageService().download_fmh_sample("Suppliers_sample.xlsx")
    except StorageError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return Response(
        content=data,
        media_type=XLSX_CONTENT_TYPE,
        headers={"Content-Disposition": 'attachment; filename="Suppliers_sample.xlsx"'},
    )

@router.get("/fmh-sample-supplier-pricings")
async def download_fmh_sample_supplier_pricings() -> Response:
    if not is_storage_configured():
        raise HTTPException(status_code=503, detail="Storage not configured")
    try:
        data = await StorageService().download_fmh_sample("SponsoredSupplierPricings_sample.xlsx")
    except StorageError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return Response(
        content=data,
        media_type=XLSX_CONTENT_TYPE,
        headers={"Content-Disposition": 'attachment; filename="SponsoredSupplierPricings_sample.xlsx"'},
    )
```

**Route ordering note:** Both GET routes must be declared **before** any `/{id}` route in the router to avoid path conflicts.

---

### 3. New endpoint in `ingredients.py`

**File:** `backend/app/api/ingredients.py`

```python
from fastapi.responses import Response
from app.domain.storage_service import StorageService, StorageError, is_storage_configured

XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

@router.get("/fmh-sample-items")
async def download_fmh_sample_items() -> Response:
    if not is_storage_configured():
        raise HTTPException(status_code=503, detail="Storage not configured")
    try:
        data = await StorageService().download_fmh_sample("ProductList_sample.xlsx")
    except StorageError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return Response(
        content=data,
        media_type=XLSX_CONTENT_TYPE,
        headers={"Content-Disposition": 'attachment; filename="ProductList_sample.xlsx"'},
    )
```

Same route-ordering caveat applies.

---

## Frontend Changes

### 4. Add API helper functions

**File:** `frontend/src/lib/api.ts`

Add three functions that fetch each endpoint and return a `Blob`:

```typescript
export async function downloadFMHSampleSupplier(): Promise<Blob> {
  return fetchApiBlob('/suppliers/fmh-sample-supplier')
}

export async function downloadFMHSampleSupplierPricings(): Promise<Blob> {
  return fetchApiBlob('/suppliers/fmh-sample-supplier-pricings')
}

export async function downloadFMHSampleItems(): Promise<Blob> {
  return fetchApiBlob('/ingredients/fmh-sample-items')
}
```

Add a `fetchApiBlob` helper alongside the existing `fetchApi` / `fetchApiFormData` helpers:

```typescript
async function fetchApiBlob(path: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(detail || `Request failed: ${res.status}`)
  }
  return res.blob()
}
```

---

### 5. Shared `triggerBlobDownload` utility

**File:** `frontend/src/lib/utils.ts`

Add a small utility used by all three download buttons:

```typescript
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

---

### 6. Add buttons to `/suppliers` page

**File:** `frontend/src/app/suppliers/page.tsx`

Add two export buttons in the toolbar **beside** the existing "Import (FMH)" button. Each button has its own loading state to handle concurrent clicks gracefully.

```tsx
const [downloadingSupplier, setDownloadingSupplier] = useState(false)
const [downloadingPricings, setDownloadingPricings] = useState(false)

const handleDownloadSampleSupplier = async () => {
  setDownloadingSupplier(true)
  try {
    const blob = await downloadFMHSampleSupplier()
    triggerBlobDownload(blob, 'Suppliers_sample.xlsx')
  } catch {
    toast.error('Failed to download sample supplier file')
  } finally {
    setDownloadingSupplier(false)
  }
}

const handleDownloadSamplePricings = async () => {
  setDownloadingPricings(true)
  try {
    const blob = await downloadFMHSampleSupplierPricings()
    triggerBlobDownload(blob, 'SponsoredSupplierPricings_sample.xlsx')
  } catch {
    toast.error('Failed to download sample supplier pricings file')
  } finally {
    setDownloadingPricings(false)
  }
}
```

Toolbar placement (beside "Import (FMH)"):

```tsx
<Button variant="outline" onClick={handleDownloadSampleSupplier} disabled={downloadingSupplier}>
  <Download className="h-4 w-4" />
  <span className="hidden sm:inline">
    {downloadingSupplier ? 'Downloading…' : 'Export Sample Suppliers (FMH)'}
  </span>
</Button>

<Button variant="outline" onClick={handleDownloadSamplePricings} disabled={downloadingPricings}>
  <Download className="h-4 w-4" />
  <span className="hidden sm:inline">
    {downloadingPricings ? 'Downloading…' : 'Export Sample Supplier Pricings (FMH)'}
  </span>
</Button>
```

Add `Download` to the lucide-react import line.

---

### 7. Add button to `/ingredients` page (Ingredients tab only)

**File:** `frontend/src/app/ingredients/page.tsx`

Add one export button beside the existing "Import (FMH)" button. Only visible when the active tab is `ingredients`.

```tsx
const [downloadingItems, setDownloadingItems] = useState(false)

const handleDownloadSampleItems = async () => {
  setDownloadingItems(true)
  try {
    const blob = await downloadFMHSampleItems()
    triggerBlobDownload(blob, 'ProductList_sample.xlsx')
  } catch {
    toast.error('Failed to download sample product list file')
  } finally {
    setDownloadingItems(false)
  }
}
```

```tsx
<Button type="button" variant="outline" onClick={handleDownloadSampleItems} disabled={downloadingItems}>
  <Download className="h-4 w-4" />
  <span className="hidden sm:inline">
    {downloadingItems ? 'Downloading…' : 'Export Product List (FMH)'}
  </span>
</Button>
```

Add `Download` to the lucide-react import line.

---

## Critical Files

| File | Action |
|------|--------|
| `backend/app/domain/storage_service.py` | Add `download_fmh_sample()` method |
| `backend/app/api/suppliers.py` | Add `GET /fmh-sample-supplier` and `GET /fmh-sample-supplier-pricings` |
| `backend/app/api/ingredients.py` | Add `GET /fmh-sample-items` |
| `frontend/src/lib/api.ts` | Add `fetchApiBlob`, `downloadFMHSampleSupplier`, `downloadFMHSampleSupplierPricings`, `downloadFMHSampleItems` |
| `frontend/src/lib/utils.ts` | Add `triggerBlobDownload` |
| `frontend/src/app/suppliers/page.tsx` | Add two export buttons |
| `frontend/src/app/ingredients/page.tsx` | Add one export button (Ingredients tab) |

---

## Existing Code to Reuse

- `StorageService`, `StorageError`, `is_storage_configured`, `get_http_client` — `backend/app/domain/storage_service.py`
- `Button`, `toast` — existing UI components / sonner
- `FMHSupplierImportModal`, `FMHIngredientImportModal` — existing modal components for placement reference
- `Download` icon — `lucide-react` (already a dependency)

---

## Verification

1. **Manual backend** — `GET /api/v1/suppliers/fmh-sample-supplier` via browser or curl returns a valid `.xlsx` file with `Content-Disposition: attachment`.
2. **Storage not configured** — endpoint returns `503` instead of crashing.
3. **File missing in storage** — endpoint returns `404` with a clear message.
4. **Frontend** — clicking each button triggers a browser download dialog with the correct filename.
5. **Build check** — `npm run build` and `npm run lint` pass with no type errors.
