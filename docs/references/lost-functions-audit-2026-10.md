# Lost functions audit — October 2026

After the Mission Systems redesign (changelog 0.1.1–0.1.7) users found they could not delete a dish. This audit lists every user-facing action that existed before and can no longer be reached from the UI, what was restored, and what is left.

## Method

1. **Reachability.** Built an import graph from every `src/app/**/page.tsx`, `layout.tsx` and `route.ts`, resolving barrel re-exports by name. A hook or API function counts as used only if a *reachable* file calls it. Orphaned components (like `LeftPanel`) are not callers.
2. **Unrendered components.** Files under `src/components/` that the graph never reaches.
3. **History.** Ran the same analysis on `cec6808` (just before the redesign), on `1133e38~1` (before the January canvas revamp) and on `HEAD`, then compared each mutation hook's reachable call sites and the route list.

### Results in brief

- **The redesign itself dropped nothing.** `cec6808` and `HEAD` have the same set of reachable hooks and the same routes. Every mutation hook that had callers before still has them, though many callers moved into new `_components/` files.
- **The losses are older.** Dish delete went in the January canvas revamp (`1133e38`), and the dish categories list went in the March nav restructure (`e051e16`).

## Restored

| Function | Lost in | Now |
|---|---|---|
| **Delete a dish** (soft delete: sets status to archived) | `1133e38`: `LeftPanel` stopped rendering | A **Dish actions** kebab on the dish page header (`RecipeActions`): Delete dish opens a `ConfirmModal` (sm, destructive); after delete it goes back to `/recipes`. Only the owner or an admin sees it. |
| **Restore a deleted dish** | Never had its own control (status select on the canvas only) | The same kebab shows **Restore dish** (back to draft) on an archived dish. Archived dishes are listed under the **Archived** status filter. |
| **Archived dishes leave lists and pickers** | Never did: `GET /recipes` returned archived dishes | The backend `GET /recipes` now leaves out archived dishes unless `status=archived` or `include_archived=true`. That covers the dish list, canvas library, menu-sketch and tasting dish pickers, and sub-dish lookups. The dish list's "All statuses" option is renamed **Active and draft**. |
| **Dish categories list**: browse, add, archive, unarchive | `e051e16`: `RecipeCategoriesTab` stopped rendering, though it was kept and restyled | A **Dishes · Categories** TabRail on `/recipes`, using the existing (orphaned) `recipeTab` app state. Archive/unarchive goes through the category's row menu. |

### Menu sketch behaviour on dish delete

A sketch item links to a dish by `recipe_id`, and the backend joins `recipe_name` onto it. Deleting a dish is a soft delete, so **the dish stays on any menu sketch, menu or tasting session that already uses it**, with its name and data intact. It just stops appearing in the dish list and pickers. The confirm text says this and points to the Archived filter for restoring. No item is removed automatically, so a chef never silently loses a line on a sketch.

### Removed dead code

These files were unreachable, and the new canvas (`components/canvas/*`, `useCanvasSave`) covers what they did:

- `components/layout/LeftPanel.tsx`: old dish list with create and delete
- `components/layout/RecipeCanvas.tsx`, `components/recipe/RecipeIngredientsList.tsx`, `components/recipe/RecipeIngredientRow.tsx`, `components/recipe/SubRecipesList.tsx`: the pre-January canvas (ingredients and sub-dishes add, edit, remove)

## Not restored

### Nice-to-have

| Function | Status | Recommendation |
|---|---|---|
| Reorder a dish's ingredients and sub-dishes by drag | Lost in `1133e38`. `useReorderSubRecipes` has no caller and the ingredient reorder hook is gone. | Add drag handles to `CanvasTable` rows if chefs ask. Order doesn't affect cost. |
| Tasting session stats (`useTastingSessionStats`) | Lost before January | Fold into the R&D summary if wanted. |
| Main recipe image getter (`useMainRecipeImage`), `api.updateRecipeImage` | Replaced by `Recipe.image_url` denormalisation (`4b85df9`) | Delete the hook and API function. |
| `useUpdateRecipeCategoryLink`, `useCategory`, `useAllergen`, `useIngredientAllergenLinks`, `useIngredientsByAllergen`, `useSessionRecipesFull`, `api.getUserByEmail` | Never wired, or replaced | Delete when next touched. |

### Genuinely retired

| Function | Why |
|---|---|
| Old **Menus** (`useMenus`, `useDeleteMenu`, `useRestoreMenu`, `useMenusByOutlet`, `useMenuItemsBySection`) | Nav moved to menu sketches in April (`7257681`), and ops reset #4 removed Menus data. `/menu/edit`, `/menu/new` and `/menu/preview` still build but nothing links to them. **Recommend deleting these routes and `MenuBuilder`.** |
| Standalone ingredient tasting (`useAddIngredientToSession`, `useAddIngredientsToSession`, `useRemoveIngredientFromSession`, `useSessionIngredients`, `useIngredientTastingNotes`, `useIngredientTastingSummary`) | Session ingredients are derived from the session's dishes since `d61d7ce`. |
| Per-image tasting-photo hooks (`useUploadTastingNoteImage`, `useUploadMultipleTastingNoteImages`, `useDeleteTastingNoteImage`) | Replaced by `useSyncTastingNoteImages`. |
| `useUpdateRawInstructions` | Freeform instructions save through `useUpdateRecipe`. |
| `useRecomputeCosting` | Costing recomputes on read. |
| Unused UI primitives `ui/ListSection.tsx`, `ui/MasonryGrid.tsx`, hook `useAutoFlowLayout`, `lib/supabase/server.ts` | No callers. Delete with the next design-system clean-up. |

## Still covered (checked)

Create, edit and archive are reachable for: dishes (canvas), ingredients, suppliers, supplier–ingredient links and tags, outlets (Settings › Outlets), ingredient tags and allergens, dish categories (now), menu sketches (create, fork, delete), tasting sessions (create, edit, delete, notes, photos), dish fork and version tree, costing, and image upload, generation and main-image selection.

## Follow-ups outside this change

- **Backend authorisation gap:** `DELETE /recipes/{id}`, `PATCH /recipes/{id}` and `PATCH /recipes/{id}/status` don't check that the caller owns the dish or is an admin. Only the UI hides the controls. This is a security fix for its own PR.
- `backend/pyproject.toml` pins `sqlmodel>=0.0.14` with no upper bound. A fresh install gets 0.0.48, which rejects the naive `datetime.utcnow()` values the models use, and every test errors at fixture setup. Pin `sqlmodel<0.0.30` or move the models to timezone-aware datetimes.
