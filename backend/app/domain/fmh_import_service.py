"""FMH (Food Market Hub) import service.

Implements a two-phase approach: all file parsing and in-memory mapping
completes before any DB writes occur. If mapping fails, nothing is written.
"""

from __future__ import annotations

import re

import openpyxl
from openpyxl.workbook import Workbook
from sqlmodel import Session, SQLModel, col, select

from app.models.category import Category
from app.models.ingredient import Ingredient
from app.models.outlet import Outlet, OutletType
from app.models.outlet_supplier_ingredient import OutletSupplierIngredient
from app.models.supplier import Supplier
from app.models.supplier_ingredient import SupplierIngredient

PRODUCT_CODE_COL = "Product code (Do not edit this field, this is for your reference)"

_UNIT_MAP: dict[str, str] = {
    "kg": "kg",
    "g": "g",
    "l": "l",
    "ml": "ml",
    "pcs": "pcs",
    "pc": "pcs",
}


class FMHImportResult(SQLModel):
    suppliers_created: int = 0
    suppliers_updated: int = 0
    outlets_created: int = 0
    categories_created: int = 0
    ingredients_created: int = 0
    supplier_ingredients_created: int = 0
    outlet_supplier_ingredients_created: int = 0
    warnings: list[str] = []


def _read_sheet(wb: Workbook, sheet_name: str | None = None) -> list[dict]:
    """Load a worksheet into a list of dicts keyed by header row."""
    ws = wb[sheet_name] if sheet_name else wb.active
    if ws is None:
        return []
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []
    headers = [str(h).strip() if h is not None else "" for h in rows[0]]
    result = []
    for row in rows[1:]:
        if all(v is None for v in row):
            continue
        result.append({headers[i]: row[i] for i in range(len(headers))})
    return result


def _parse_pack_from_name(name: str) -> tuple[float, str]:
    """Extract pack size and base unit from a product name string.

    E.g. "Chicken Breast 500g"  → (500.0, "g")
         "Fresh Milk 1L"        → (1.0, "l")
         "Eggs 12 pcs"          → (12.0, "pcs")

    Falls back to (1.0, "pcs") if no match found.
    """
    pattern = r"(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs?|pc|units?|oz|lbs?|lb)\b"
    match = re.search(pattern, name, re.IGNORECASE)
    if match:
        raw_unit = match.group(2).lower()
        return float(match.group(1)), _UNIT_MAP.get(raw_unit, "pcs")
    return 1.0, "pcs"


# ---------------------------------------------------------------------------
# Public import functions
# ---------------------------------------------------------------------------


def import_suppliers(
    session: Session,
    suppliers_wb: Workbook,
    pricings_wb: Workbook,
) -> FMHImportResult:
    """Import suppliers and enrich with product codes from pricings workbook.

    Phase 1 (map): reads both workbooks into memory — no DB writes.
    Phase 2 (upsert): writes to DB only after mapping is complete.
    """
    result = FMHImportResult()

    # ------------------------------------------------------------------
    # Phase 1 — Map
    # ------------------------------------------------------------------

    # Step 1: Read suppliers sheet
    supplier_rows = _read_sheet(suppliers_wb, "Suppliers")
    mapped: dict[str, dict] = {}
    for row in supplier_rows:
        name = str(row.get("Supplier name") or "").strip()
        if not name:
            continue
        mapped[name] = {
            "name": name,
            "phone_number": str(row.get("Phone number") or "").strip() or None,
            "email": str(row.get("Email Address") or "").strip() or None,
            "shipping_company_name": str(row.get("Shipping company name") or "").strip() or None,
            "address": str(row.get("Shipping address") or "").strip() or None,
            "code": None,
        }

    # Step 2: Merge codes from pricings sheet
    pricing_rows = _read_sheet(pricings_wb, "Sponsoredsupplierproducts")
    for row in pricing_rows:
        product_code = str(row.get(PRODUCT_CODE_COL) or "").strip()
        supplier_name = str(row.get("Supplier") or "").strip()
        if not product_code or not supplier_name:
            continue
        prefix = product_code.split("-")[0]
        if supplier_name in mapped:
            if mapped[supplier_name]["code"] is None:
                mapped[supplier_name]["code"] = prefix
        else:
            result.warnings.append(
                f"Supplier '{supplier_name}' in pricings not found in suppliers sheet — skipped"
            )

    # ------------------------------------------------------------------
    # Phase 2 — Upsert (1 bulk SELECT + add_all for new suppliers)
    # ------------------------------------------------------------------

    existing_suppliers = session.exec(
        select(Supplier).where(col(Supplier.name).in_(list(mapped.keys())))
    ).all()
    existing_by_name: dict[str, Supplier] = {s.name: s for s in existing_suppliers}

    new_suppliers: list[Supplier] = []
    for shape in mapped.values():
        existing = existing_by_name.get(shape["name"])
        if existing is None:
            new_suppliers.append(Supplier(
                name=shape["name"],
                phone_number=shape["phone_number"],
                email=shape["email"],
                shipping_company_name=shape["shipping_company_name"],
                address=shape["address"],
                code=shape["code"],
                is_active=True,
                source="fmh",
            ))
        else:
            if shape["code"] is not None and existing.code != shape["code"]:
                existing.code = shape["code"]
                session.add(existing)
                result.suppliers_updated += 1

    if new_suppliers:
        session.add_all(new_suppliers)
        result.suppliers_created = len(new_suppliers)

    session.commit()
    return result


def import_ingredients(
    session: Session,
    products_wb: Workbook,
) -> FMHImportResult:
    """Import outlets, categories, ingredients, and supplier-ingredient links.

    Phase 0 (guard): ensures suppliers with codes exist.
    Phase 1 (map): reads product workbook into memory — no DB writes.
    Phase 2 (upsert): writes to DB only after mapping is complete.

    Raises:
        ValueError: if no suppliers with codes are found in the DB.
    """
    result = FMHImportResult()

    # ------------------------------------------------------------------
    # Phase 0 — Guard: supplier codes must exist
    # ------------------------------------------------------------------

    suppliers = session.exec(
        select(Supplier).where(Supplier.code.is_not(None))  # type: ignore[attr-defined]
    ).all()
    if not suppliers:
        raise ValueError(
            "No suppliers with codes found. Import suppliers first."
        )
    supplier_by_code: dict[str, Supplier] = {s.code: s for s in suppliers if s.code}

    # ------------------------------------------------------------------
    # Phase 1 — Map (single pass over product_rows)
    # ------------------------------------------------------------------

    product_rows = _read_sheet(products_wb)

    outlet_names: set[str] = set()
    category_names: set[str] = set()
    ingredient_shapes: dict[str, dict] = {}
    si_shapes: dict[str, dict] = {}

    for row in product_rows:
        # Collect outlet branch names (from all rows, no product_code requirement)
        branch_raw = str(row.get("Branch") or "").strip()
        branches = [b.strip() for b in branch_raw.split(",") if b.strip()]
        outlet_names.update(branches)

        # Collect category names (from all rows)
        tag = str(row.get("Tags") or "").strip()
        if tag:
            category_names.add(tag)

        product_code = str(row.get("Product code") or "").strip()
        if not product_code:
            continue

        name = str(row.get("Product name") or "").strip()

        # Map ingredient — first occurrence wins, requires non-empty name
        if product_code not in ingredient_shapes and name:
            pack_size, base_unit = _parse_pack_from_name(name)
            try:
                price_raw = row.get("Price")
                price = float(price_raw) if price_raw not in (None, "") else None
                cost = (price / pack_size) if price and pack_size else price
            except (TypeError, ValueError, ZeroDivisionError):
                cost = None
            ingredient_shapes[product_code] = {
                "name": name,
                "base_unit": base_unit,
                "cost_per_base_unit": cost,
                "tag": tag,
                "source": "fmh",
                "pack_size": pack_size,  # cached to avoid re-running regex in SI loop
            }

        # Map supplier-ingredient link — last occurrence wins
        prefix = product_code.split("-")[0]
        if prefix not in supplier_by_code:
            result.warnings.append(
                f"No supplier with code '{prefix}' for product '{product_code}' — skipped"
            )
            continue
        try:
            price_raw = row.get("Price")
            price_per_pack = float(price_raw) if price_raw not in (None, "") else 0.0
        except (TypeError, ValueError):
            price_per_pack = 0.0
        # Reuse cached pack_size/base_unit; fall back to parsing name if ingredient was skipped
        if product_code in ingredient_shapes:
            pack_size = ingredient_shapes[product_code]["pack_size"]
            base_unit = ingredient_shapes[product_code]["base_unit"]
        else:
            pack_size, base_unit = _parse_pack_from_name(name)
        si_shapes[product_code] = {
            "supplier_code_prefix": prefix,
            "sku": product_code,
            "pack_size": pack_size,
            "pack_unit": base_unit,
            "price_per_pack": price_per_pack,
            "currency": "SGD",
            "source": "fmh",
            "branches": branches,
        }

    # ------------------------------------------------------------------
    # Phase 2 — Upsert (batch inserts: 1 flush per entity type)
    # ------------------------------------------------------------------

    # 5. Upsert outlets — bulk pre-load, then add_all + single flush
    outlet_by_name: dict[str, Outlet] = {}
    if outlet_names:
        existing_outlets = session.exec(
            select(Outlet).where(col(Outlet.name).in_(outlet_names))
        ).all()
        outlet_by_name = {o.name: o for o in existing_outlets}
    new_outlets: list[tuple[str, Outlet]] = [
        (branch, Outlet(
            name=branch,
            code=None,  # type: ignore[arg-type]
            outlet_type=OutletType.BRAND,
            parent_outlet_id=None,
            is_active=True,
            source="fmh",
        ))
        for branch in outlet_names
        if branch not in outlet_by_name
    ]
    if new_outlets:
        session.add_all([o for _, o in new_outlets])
        session.flush()
        for branch, outlet in new_outlets:
            outlet_by_name[branch] = outlet
        result.outlets_created = len(new_outlets)

    # 6. Upsert categories — bulk pre-load, then add_all + single flush
    category_by_tag: dict[str, Category] = {}
    if category_names:
        existing_cats = session.exec(
            select(Category).where(col(Category.name).in_(category_names))
        ).all()
        category_by_tag = {c.name: c for c in existing_cats}
    new_cats: list[tuple[str, Category]] = [
        (tag, Category(name=tag, source="fmh"))
        for tag in category_names
        if tag not in category_by_tag
    ]
    if new_cats:
        session.add_all([c for _, c in new_cats])
        session.flush()
        for tag, cat in new_cats:
            category_by_tag[tag] = cat
        result.categories_created = len(new_cats)

    # 7. Upsert ingredients — bulk pre-load, then add_all + single flush
    # Deduplicate by name: multiple product_codes can share one ingredient name.
    ingredient_by_product_code: dict[str, Ingredient] = {}
    existing_ing_by_name: dict[str, Ingredient] = {}
    if ingredient_shapes:
        ingredient_names = [s["name"] for s in ingredient_shapes.values()]
        existing_ings = session.exec(
            select(Ingredient).where(col(Ingredient.name).in_(ingredient_names))
        ).all()
        existing_ing_by_name = {i.name: i for i in existing_ings}

    new_ings_by_name: dict[str, Ingredient] = {}
    for product_code, shape in ingredient_shapes.items():
        name = shape["name"]
        if name in existing_ing_by_name:
            ingredient_by_product_code[product_code] = existing_ing_by_name[name]
        elif name not in new_ings_by_name:
            category_id = category_by_tag[shape["tag"]].id if shape["tag"] in category_by_tag else None
            new_ings_by_name[name] = Ingredient(
                name=name,
                base_unit=shape["base_unit"],
                cost_per_base_unit=shape["cost_per_base_unit"],
                category_id=category_id,
                source=shape["source"],
                is_active=True,
            )
    if new_ings_by_name:
        session.add_all(list(new_ings_by_name.values()))
        session.flush()
        result.ingredients_created = len(new_ings_by_name)
    # Map product_codes to newly created ingredients
    for product_code, shape in ingredient_shapes.items():
        if shape["name"] in new_ings_by_name:
            ingredient_by_product_code[product_code] = new_ings_by_name[shape["name"]]

    # 8. Upsert SupplierIngredients — bulk pre-load, then add_all + single flush
    si_by_sku: dict[str, SupplierIngredient] = {}
    if si_shapes:
        existing_sis = session.exec(
            select(SupplierIngredient).where(col(SupplierIngredient.sku).in_(list(si_shapes.keys())))
        ).all()
        si_by_sku = {si.sku: si for si in existing_sis}

    new_sis: list[tuple[str, SupplierIngredient]] = []
    for product_code, shape in si_shapes.items():
        if product_code in si_by_sku:
            continue
        supplier = supplier_by_code.get(shape["supplier_code_prefix"])
        ingredient = ingredient_by_product_code.get(product_code)
        if supplier is None or ingredient is None:
            continue
        new_sis.append((product_code, SupplierIngredient(
            supplier_id=supplier.id,
            ingredient_id=ingredient.id,
            sku=product_code,
            pack_size=shape["pack_size"],
            pack_unit=shape["pack_unit"],
            price_per_pack=shape["price_per_pack"],
            currency=shape["currency"],
            source=shape["source"],
        )))
    if new_sis:
        session.add_all([si for _, si in new_sis])
        session.flush()
        for product_code, si in new_sis:
            si_by_sku[product_code] = si
        result.supplier_ingredients_created = len(new_sis)

    # Upsert OutletSupplierIngredients — bulk pre-load, add_all, no per-row flush
    all_si_ids = [si.id for si in si_by_sku.values() if si.id is not None]
    existing_osi_keys: set[tuple[int, int]] = set()
    if all_si_ids:
        existing_osis = session.exec(
            select(OutletSupplierIngredient).where(
                col(OutletSupplierIngredient.supplier_ingredient_id).in_(all_si_ids)
            )
        ).all()
        existing_osi_keys = {(o.supplier_ingredient_id, o.outlet_id) for o in existing_osis}

    new_osis: list[OutletSupplierIngredient] = []
    for product_code, shape in si_shapes.items():
        si = si_by_sku.get(product_code)
        if si is None or si.id is None:
            continue
        for branch in shape["branches"]:
            outlet = outlet_by_name.get(branch)
            if outlet is None or outlet.id is None:
                continue
            key = (si.id, outlet.id)
            if key in existing_osi_keys:
                continue
            new_osis.append(OutletSupplierIngredient(
                supplier_ingredient_id=si.id,
                outlet_id=outlet.id,
            ))
            existing_osi_keys.add(key)
    if new_osis:
        session.add_all(new_osis)
    result.outlet_supplier_ingredients_created = len(new_osis)

    session.commit()
    return result
