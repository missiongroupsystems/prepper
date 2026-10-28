# Layout audit (October 2026)

A read-only audit of every route except `/menu-sketch/[id]`, which was fixed separately. Pages are measured against Workforce conventions:
- a 1080px measure, with page padding of px-5 / sm:px-8 / lg:px-12;
- a SectionHeader with an actions slot;
- SidePanel for create and edit, a small Dialog for confirm, EmptyState for every empty list;
- labelled fields;
- 44px touch targets on phones;
- sentence case, font weights ≤500, tabular money;
- autosave only.

Paths are relative to `frontend/src`.

## Cross-cutting
- **No shared page shell.** Widths vary from page to page (`max-w-7xl`, `5xl`, `4xl`, `2xl`), and padding is a fixed `p-6`. Phase 2B's `Page` component fixes this.
- **`SidePanel` is unused.** Every create and edit form is a `Modal` or a hand-built `fixed inset-0` overlay.
- **Headers are inconsistent.** Detail pages put the h1 inside a Card instead of using `PageHeader`/`SectionHeader`, so the header and actions sit in a different place on every page.
- **Hover-only row menus** are unreachable on touch screens.
- **Explicit Save/Submit buttons go against the autosave rule:** in `CanvasTab`, `MenuBuilder`, and the row editing on detail pages.

## High
1. **Recipe canvas: `/recipes/[id]` and `/recipes/new`.** Files: `components/layout/tabs/CanvasTab.tsx` (3,181 lines) and `RightPanel.tsx` (731). Effort: L.
   - Problems:
     - It runs edge to edge with a fixed `w-72` right panel.
     - Text is tiny: 15 uses of `text-[10px]`/`[11px]` in the panel and 46 of `text-xs`.
     - The metadata row is a 5-column grid with `w-16`/`w-20` inputs.
     - The footer has six actions, including Submit with a confirm.
     - Row menus are hover-only.
   - Fix:
     - Split the file into hook / CanvasTable / StagedCards / CanvasHeader.
     - Make the panel a SidePanel below `lg`.
     - Use a labelled 2–3 column metadata grid.
     - Move secondary actions into a Menu.
     - Raise text to `text-sm`.
2. **Ingredient, supplier and outlet detail pages: `/ingredients/[id]`, `/suppliers/[id]`, `/outlets/[id]`.** Files: 1,065 / 755 / 692 lines. Effort: L.
   - Problems:
     - Raw 8-column tables with inline inputs, and the two supplier-link tables are near-duplicates.
     - Row menus are hover-only.
     - Row editing uses explicit Save/Cancel buttons.
     - The seven-field link form sits in a `max-w-lg` Modal with `text-xs` labels.
   - Fix:
     - A shared `SupplierLinksTable` on the Table primitive, stacking on phones, with a visible kebab Menu.
     - `EditableCell` autosave instead of Save/Cancel.
     - A SidePanel for linking.
     - A header with an actions slot, and tabular money.
3. **Menu builder: `/menu/new` and `/menu/edit/[id]`.** File: `components/menu/MenuBuilder.tsx` (1,033 lines). Effort: M–L.
   - Problems:
     - Fields are labelled only by their placeholder, and stacked in rows (search, select, a `w-20` price input, three textareas).
     - Labels are `text-xs`.
     - There is a "Save Changes" button, and Cancel goes to `/recipes`.
   - Fix:
     - Edit items in a SidePanel; each row shows just the name, the price and a kebab menu.
     - Autosave.
     - Split the file.

## Medium
4. **Top nav, between 768 and 1280px.** Icons only, with hover tooltips. Superseded by the Phase 2B left rail.
5. **R&D: `/rnd` (817 lines) and `/rnd/r/[recipeId]` (1,129 lines).** Effort: M.
   - Problems:
     - The kanban uses `md:grid-cols-3`, and cards have a fixed `min-w-[280px] max-w-[320px]`.
     - The ReactFlow view is fixed at `h-[500px]`, so it scrolls inside a page that also scrolls.
     - The tabs are hand-rolled, and kanban columns have no empty state.
   - Fix: switch the kanban to `lg:grid-cols-3`, size the flow to the viewport, add EmptyState to each column, and use TabRail.
6. **Settings: `/settings` and its tabs.** Each tab has its own `max-w-7xl`, create forms use hand-built overlays, and cards go up to `xl:grid-cols-4`. Fix: use the shared shell, SidePanel and Dialog. Effort: M.
7. **Recipe tabs: Overview (859 lines), Costs, Versions.** Widths are mixed (5xl and 4xl), cost tables don't use tabular numbers, and version cards have a fixed `min-w-[280px]`. Effort: M.
8. **Long create modals:** `AddIngredientModal` (about 20 fields, `max-w-2xl`), `AddSupplierModal`, `AddOutletModal`, and `admin/AddUserModal` (`text-xs` labels). Move them to a SidePanel. Effort: M.
9. **`/ingredients` filter row.** Search plus a `w-44` and a `w-36` select plus the view toggle sit in one row that doesn't wrap, so it overflows on phones. Wrap it, or use a filter Menu. Effort: S.
10. **`/tastings/[id]` (1,094 lines).** The add-recipes picker and the confirm are both inline, and the badges are `text-xs`. Split the file and use a SidePanel for the picker. Effort: M.

## Low
- **`/menu/preview/[id]`:** uses `max-w-5xl`, has 14 `text-xs`, and its empty state is a bare `<p>`.
- **Simple lists using `max-w-7xl`** (`/suppliers`, `/tastings`, `/menu`, `/menu-sketch`, `/finance`, the recipe list): only the width needs changing. Finance should use `wide`.
- **`CanvasLayout` back link:** `text-xs` in a `py-1.5` bar. It should be `text-sm` with a 44px target on phones.

## Phase 3 tracks (no shared files)
| Track | Scope |
|---|---|
| B: Recipe canvas | `components/layout/tabs/CanvasTab.tsx`, `RightPanel.tsx`, `LeftPanel.tsx` |
| C: Recipe tabs | `OverviewTab`, `CostsTab`, `VersionsTab`, `OutletsTab`, `TastingTab` |
| D: Catalogue detail pages | `app/ingredients/[id]`, `app/suppliers/[id]`, `app/outlets/[id]`, `app/recipe-categories/[id]`, plus a new `SupplierLinksTable` |
| E: Menus | `components/menu/MenuBuilder.tsx`, `app/menu/**` |
| F: Create forms and settings | `components/{ingredients,recipes,admin,suppliers,outlets}/*`, `app/ingredients/page.tsx`, `app/settings` |
| G: R&D and tasting | `app/rnd/**`, `app/tastings/**`, `components/tasting/*` |

Track A (shell and nav) is Phase 2B.
