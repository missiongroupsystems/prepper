# Plan 28 — Dish Draft: Combined Ingredient Search

## Source
Notion page: https://www.notion.so/345ca9b8c2ee8039b742d45316931b3d

## Problem
The ingredient search in the dish draft (menu sketch) supports single-field queries but fails on combined queries. Internally the backend applies a single `ILIKE` pattern with `OR` across ingredient name, category name, and supplier name — so `phoon huat baking sheet` finds no results because no single field contains the full string.

| Query type | Example | Result |
|---|---|---|
| Item name only | `baking sheet` | ✅ Returns matches |
| Supplier only | `phoon huat` | ✅ Returns matches |
| Supplier + item name | `phoon huat baking sheet` | ❌ No results |

## Expected behaviour
Split the query into whitespace-separated tokens. Each token must match either the ingredient name **or** a linked supplier name (case-insensitive, substring). All tokens must match (strict AND). Token order is irrelevant.

Example: `phoon huat baking sheet` → returns ingredients named "Baking Sheet" linked to supplier "Phoon Huat".

---

## Part 1 — Backend: Multi-token AND search

### What changes
`backend/app/domain/ingredient_service.py` — `_build_list_query()` method (lines ~89–112).

Replace the current single-term `OR` pattern with a token-split `AND` approach:

```python
if search:
    from sqlalchemy import and_, or_
    from app.models.supplier_ingredient import SupplierIngredient as SI
    from app.models.supplier import Supplier

    tokens = search.split()   # split on whitespace; empty list if blank
    token_conditions = []

    for token in tokens:
        term = f"%{token}%"
        # Subquery: ingredient IDs that have a matching supplier name for this token
        sup_subq = (
            select(SI.ingredient_id)
            .join(Supplier, SI.supplier_id == Supplier.id)
            .where(Supplier.name.ilike(term))
        ).scalar_subquery()

        # Each token must match ingredient name OR any linked supplier name
        token_conditions.append(
            or_(
                Ingredient.name.ilike(term),
                Ingredient.id.in_(sup_subq),
            )
        )

    if token_conditions:
        statement = statement.where(and_(*token_conditions))
```

### Notes
- Drop the category-name sub-query from the search block — category filtering is already a dedicated `category` / `category_ids` param.
- `tokens = search.split()` naturally handles extra whitespace and returns `[]` for blank input, so the guard `if search:` is still sufficient.
- No minimum token-length threshold (per acceptance criteria).
- Existing single-field queries continue to work because a single token with no space still produces one `OR` condition.

### Acceptance criteria
1. `phoon huat baking sheet` returns rows where ingredient name contains "baking sheet" AND a linked supplier name contains "phoon" AND "huat".
2. `baking sheet phoon huat` returns the same results as above (token order irrelevant).
3. `baking sheet` alone still returns all ingredients whose name contains "baking sheet".
4. `phoon huat` alone still returns all ingredients linked to a supplier whose name contains "phoon huat".
5. Matching is case-insensitive (ILIKE).
6. Partial/substring matches work (consistent with current behaviour).

### Tests to add/update
File: `backend/tests/test_ingredients.py`
- `test_search_by_name_only` — existing, verify still passes.
- `test_search_by_supplier_only` — existing, verify still passes.
- `test_search_combined_supplier_and_name` — **new**: create ingredient + supplier link, assert combined query returns the ingredient.
- `test_search_combined_token_order_irrelevant` — **new**: assert reversed token order returns same results.
- `test_search_combined_no_match` — **new**: assert query with non-matching token returns empty list.

---

## Part 2 — Frontend: Show supplier context in search dropdown

### What changes
`frontend/src/app/menu-sketch/[id]/page.tsx` — the ingredient suggestions dropdown (lines ~982–1013).

Currently each suggestion renders only the ingredient name. Add a secondary line showing the first matched supplier name (from the `Ingredient.supplier_ingredients` array if returned, or from a new field — see Plan 29 Part 1 which adds supplier names to the list DTO).

> **Dependency**: Part 2 of this plan depends on Plan 29 Part 1 (supplier names included in `IngredientListRead`). If Plan 29 is not yet merged, the supplier line can be omitted from the dropdown and this part delivered independently.

### UI change
In the suggestion list item, below the ingredient name, render a small muted line:

```
Baking Sheet           ← ingredient name (existing)
Phoon Huat             ← supplier name(s), muted/secondary style, truncated at 10 chars
```

- If no supplier, show nothing (not `—`) in the dropdown (space is tight).
- Truncate supplier names at 10 characters + `…` to match Plan 29 R5.
- Multiple suppliers: comma-separated on one line.

### Acceptance criteria
1. Searching `phoon huat baking sheet` shows results with "Phoon Huat" visible under the ingredient name.
2. Searching `baking sheet` with no supplier tokens still shows matching ingredients (supplier line is informational only).
3. Suggestion list item height does not overflow the dropdown container.
4. No change to "Load more" or "Create new ingredient" row behaviour.
