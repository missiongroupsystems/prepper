# Mission Recipes: data survey (October 2026)

Read-only survey of the data Mission Recipes (repo `prepper`) holds, as input for aligning it with the Mission Systems shared operational model.

- **Code basis:** branch `claudani/data-survey-4c7668` @ `6507799`. Alembic head is `b8c9d0e1f2g3`, and the live DB matches it.
- **Live snapshot:** queried 2026-10-28 08:28 UTC against Supabase project `kcntk…hwsgi` (Postgres 17.6), the database in the main checkout's `backend/.env`. Every statement ran as a `SELECT` inside a `READ ONLY` transaction. Only aggregates are reported here: no emails, phone numbers or people's names.

---

## 1. Summary

- **Recipes is small and mostly a pilot dataset.** It holds 155 recipes, all in `DRAFT` status. 86 of them (55%) have no ingredients or sub-recipes. 100 of the 155 belong to one owner. Recipe creation peaked between March and May 2026 and has been near-zero since July. Menu sketches are the only area with recent writes: 18 sketches were updated in the last 30 days, the latest today.
- **The large, reusable assets are the FoodMarketHub (FMH) import.** It accounts for 1,191 of 1,259 ingredients, 316 of 323 suppliers, all 1,191 supplier-ingredient price rows (SGD) and 7 of 16 outlets. That data belongs to the shared **Stock / Suppliers** domains rather than to Recipes.
- **Organisation:** there is no organisation, tenant or group concept. Outlets are the top of the hierarchy, as 11 root `BRAND` outlets and 2 levels at most.
- **Identity:** Supabase `auth.users` is the authentication source. A local `public.users` table holds role (`user_type`, `is_manager`) and outlet scope. The `ebb-flow-tech-auth` library only verifies JWTs.
- **Passport:** I found no evidence that Recipes is connected to Passport. The repo, the auth library, the env vars, the Supabase auth config and the JWT claims contain no Passport or SSO integration and no org claims. Sign-in is Supabase email/password (26 users) or Google OAuth (2 users). So, to Dani's question: **no, Recipes isn't connected to Passport today, and nothing in its data says "Mission Group"**. One user does have a `missiongroup.com` email domain.
- **RLS is on for every app table** (32 of 32, each with 3–4 policies). Only `alembic_version` lacks it.
- **Outlet scoping is barely used in practice:** only 1 of 155 recipes is linked to an outlet. Access is effectively decided by `owner_id` and admin role.

---

## 2. Schema inventory

All tables live in Supabase Postgres, schema `public`. "RLS" summarises the SELECT policy from `h1i2j3k4l5m6_add_row_level_security.py` and `i1j2k3l4m5n6_menu_sketch_relational_refactor.py`. Writes are gated to owner, manager or admin. "Shared model" is the Mission Systems domain each table maps to.

| Table | Purpose | Key columns | FKs | Soft-delete / archive | RLS (select) | Shared model |
|---|---|---|---|---|---|---|
| `users` | App profile per Supabase user: role and outlet scope | `id` (text = `auth.users.id`), `email`, `username`, `user_type` (NORMAL/ADMIN), `is_manager`, `phone_number` | `outlet_id → outlets` (no FK to `auth.users`) | — | self or admin | **People** |
| `outlets` | Brand → location hierarchy (top of tenancy) | `name`, `code`, `outlet_type` (BRAND/LOCATION), `source` (manual/fmh) | `parent_outlet_id → outlets` (self, cycle-checked in app) | `is_active` | `true` (reference) | **Sites/Outlets** |
| `recipes` | Recipe and version node | `name`, `yield_quantity/unit`, `is_prep_recipe`, `status` (DRAFT/ACTIVE/ARCHIVED), `version`, `cost_price` (cached), `selling_price_est`, `is_public`, `owner_id`, `rnd_started`, `review_ready`, `summary_feedback`, `image_url` | `root_id → recipes` (fork parent); `owner_id` text, **no FK** | `status=ARCHIVED` | owner, public or admin | **Recipes** |
| `recipe_ingredients` | BOM line: ingredient in a recipe | `quantity`, `unit`, `unit_price`, `base_unit`, `wastage_percentage` (0–100) | `recipe_id`, `ingredient_id`; `supplier_id` **no FK** | — | via `can_access_recipe` | **Recipes** (BOM) → Stock |
| `recipe_recipes` | Sub-recipe BOM line | `quantity`, `unit` (PORTION/BATCH/GRAM/MILLILITER), `position` | `parent_recipe_id`, `child_recipe_id → recipes` (cycle-checked in app) | — | via recipe | **Recipes** |
| `recipe_outlets` | Recipe availability and price per outlet | `is_active`, `price_override` | PK (`recipe_id`, `outlet_id`) | `is_active` | via recipe | Recipes × Sites |
| `recipe_images` | Recipe photos (Storage URLs) | `image_url`, `is_main`, `order` | `recipe_id` | — | via recipe | Recipes |
| `recipe_categories` / `recipe_recipe_categories` | Recipe taxonomy and its join table | `name`; join has `is_active` | `recipe_id`, `category_id` | `is_active` | `true` / via recipe | Recipes |
| `ingredients` | Ingredient master, with optional variant → master link | `name`, `base_unit`, `cost_per_base_unit`, `is_halal`, `source` (manual/fmh), legacy `category` string | `category_id → categories`, `master_ingredient_id → ingredients` | `is_active` | `true` (reference) | **Stock** (item master) |
| `categories` | Ingredient categories | `name`, `source` | — | `is_active` | `true` | Stock |
| `allergens` / `ingredient_allergens` | Allergen list and ingredient↔allergen tags | `name` | `ingredient_id`, `allergen_id` | `is_active` (allergens) | `true` | Stock |
| `suppliers` | Supplier master | `name`, `code`, `address`, `phone_number`, `email`, `shipping_company_name`, `source` | — | `is_active` | `true` | **Suppliers** |
| `supplier_ingredients` | Supplier catalogue line (pack and price) | `sku` (unique), `pack_size`, `pack_unit`, `price_per_pack`, `currency` (SGD), `is_preferred`, `source` | `ingredient_id`, `supplier_id` | — | `true` | **Suppliers** / Orders (price list) |
| `outlet_supplier_ingredient` | Which outlets buy a given catalogue line | — | `supplier_ingredient_id`, `outlet_id` | — | `true` | Suppliers × Sites |
| `supplier_ingredient_tags` / `supplier_ingredient_supplier_ingredient_tags` | Free tags on catalogue lines | `name` | link FKs (cascade) | `is_active` | `true` | Suppliers |
| `tasting_sessions` | R&D tasting event | `name`, `date`, `location`, `notes` | `creator_id → users` | — | creator, participant or admin | Recipes (R&D) |
| `tasting_users` | Session participants | — | `tasting_session_id`, `user_id → users` | — | via session | People × Recipes |
| `recipe_tastings` / `ingredient_tastings` | Items on a session's agenda | `sequence` (recipe) | session plus recipe/ingredient | — | via session | Recipes / Stock |
| `tasting_notes` / `ingredient_tasting_notes` | Per-taster feedback | ratings 1–5, `feedback`, `action_items`, `action_items_done`, `decision` (approved/needs_work/rejected), `taster_name` | session, recipe/ingredient, `user_id → users` | — | via session; write own | Recipes (R&D) |
| `tasting_note_images` | Photos on tasting notes | `image_url` | `tasting_note_id` or `ingredient_tasting_note_id` | — | via session | Recipes |
| `menus` / `menu_sections` / `menu_items` / `menu_outlets` | Structured, published menus (older model) | `name`, `is_published`, `version_no`; items have `display_price`, `substitution`, etc. | `created_by → users`, `recipe_id`, `outlet_id` | `is_active` (menus) | creator or manager | Recipes → **Orders/POS** menu |
| `menus_sketch` | Freeform menu sketch (current model) | `name`, `version`, `status` (draft/archived), `notes` (Tiptap HTML) | `root → menus_sketch` (fork) | `status=archived` | `true` | Recipes → menu |
| `menu_sketch_section` / `menu_sketch_section_item` / `menu_sketch_section_item_comments` | Sketch sections, items and review comments | item: `sales_price`, `cost_price`, `margin`, `is_highlight`, **`icons` (JSON array)**; comment: `text`, `resolved` | section → sketch, item → section and `recipe_id` | `resolved` (comments) | `true` | Recipes → menu |

**JSON and semi-structured blobs**
- `recipes.instructions_structured` (JSON) holds the structured instruction steps. It is populated on all 155 recipes, while `instructions_raw` is empty on all of them.
- `menu_sketch_section_item.icons` (JSON array) holds display icons. It is empty on all 85 rows.
- `menus_sketch.notes` holds Tiptap HTML as text.
- `recipes.cost_price` is a cached derived value. Costing is recomputed in `costing_service.py`.

**Columns that reference other tables without an FK constraint:** `recipes.owner_id`, `recipe_ingredients.supplier_id`, `users.id` (which points at `auth.users`), and `recipes.created_by` / `updated_by` (free text).

**Storage:** a single bucket, `prepper`, which is public with no size or MIME limits configured. Prefixes are set by `SUPABASE_*_FOLDER` env vars. The repo docs call it `recipe-images`, but that is the folder, not the bucket.

---

## 3. Live data snapshot (2026-10-28 08:28 UTC)

### Row counts and date ranges

"Active" means `is_active = true`, or not archived where the table uses a status column. Dates are `min(created_at)` to `max(updated_at)`.

| Table | Rows | Active | First | Last |
|---|---:|---:|---|---|
| users | 27 | — | 2026-01-23 | 2026-06-22 |
| outlets | 16 | 16 | 2026-01-27 | 2026-05-05 |
| recipes | 155 | 155 (all DRAFT) | 2026-03-03 | 2026-06-22 |
| recipe_ingredients | 227 | — | 2026-03-03 | 2026-06-22 |
| recipe_recipes | 18 | — | 2026-03-05 | 2026-04-24 |
| recipe_outlets | 1 | 1 | 2026-03-06 | 2026-03-06 |
| recipe_images | 3 | — | 2026-03-06 | 2026-03-12 |
| recipe_categories / links | 15 / 3 | 15 / 3 | 2026-03-05 | 2026-03-12 |
| ingredients | 1,259 | 1,259 | 2026-02-25 | 2026-05-05 |
| categories | 99 | 96 | 2026-01-19 | 2026-05-05 |
| allergens / ingredient_allergens | 11 / 1 | 11 | 2026-02-20 | 2026-03-10 |
| suppliers | 323 | 316 | 2026-01-05 | 2026-05-05 |
| supplier_ingredients | 1,191 | — | 2026-04-14 | 2026-05-05 |
| outlet_supplier_ingredient | 278 | — | 2026-04-14 | 2026-05-05 |
| supplier_ingredient_tags / links | 0 / 0 | — | — | — |
| tasting_sessions | 45 | — | 2026-03-03 | 2026-05-19 |
| tasting_users | 68 | — | 2026-03-03 | 2026-05-19 |
| recipe_tastings / ingredient_tastings | 65 / 8 | — | 2026-03-04 | 2026-05-20 |
| tasting_notes / ingredient_tasting_notes | 39 / 0 | — | 2026-03-04 | 2026-05-20 |
| tasting_note_images | 31 | — | 2026-03-04 | 2026-03-12 |
| menus / sections / items / outlets | 6 / 9 / 12 / 16 | 5 menus | 2026-03-06 | 2026-04-14 |
| menus_sketch | 21 | 1 draft, 20 archived | 2026-03-25 | **2026-10-28** |
| menu_sketch_section / item / comments | 30 / 85 / 0 | — | 2026-04-16 | 2026-06-10 |

Recipes created per month: 31 in 2026-03, 81 in 2026-04, 38 in 2026-05 and 5 in 2026-06.

### Outlet hierarchy

There are 16 outlets: 11 roots, at most 2 levels deep, all active, and no cycles.

| Path | Code | Type | Source | Users | Recipes | Supplier lines | Menus |
|---|---|---|---|---:|---:|---:|---:|
| Casa Vostra | CSA | BRAND | manual | 0 | 0 | 0 | 2 |
| ├ Casa Vostra Raffles City | CRC | LOCATION | manual | 1 | 0 | 0 | 2 |
| └ Casa Vostra Tampines Mall | CTM | LOCATION | manual | 0 | 0 | 0 | 1 |
| Chin Mee Chin | CMC | BRAND | manual | 2 | 0 | 0 | 1 |
| Temper | TMP | BRAND | manual | 5 | 1 | 0 | 4 |
| Willow | WLW | BRAND | manual | 1 | 0 | 0 | 2 |
| Outlet A | OA | BRAND | manual | 0 | 0 | 0 | 2 |
| └ Outlet A (Geylang) | OAG | LOCATION | manual | 0 | 0 | 0 | 2 |
| ECR - CMC | — | BRAND | fmh | 0 | 0 | 249 | 0 |
| JEM - CASA VOSTRA | — | BRAND | fmh | 0 | 0 | 4 | 0 |
| RC - CASA VOSTRA | — | BRAND | fmh | 0 | 0 | 4 | 0 |
| (CARLITOS) CAN CARLITOS PTE LTD | — | BRAND | fmh | 0 | 0 | 4 | 0 |
| (DRAGON CHAMBER) CIRCULAR DRAGON PTE LTD | — | BRAND | fmh | 0 | 0 | 5 | 0 |
| (GALIENA) GALIENA PTE LTD | — | BRAND | fmh | 0 | 0 | 4 | 0 |
| (TEMPER) TEMPER PTE LTD | — | BRAND | fmh | 0 | 0 | 4 | 0 |
| (WINE KIN) WINE KIN PTE LTD | — | BRAND | fmh | 0 | 0 | 4 | 0 |

The FMH import created its outlets as flat `BRAND` roots named after buying entities or legal companies. They are not linked to the manual brand tree, so "Temper", "(TEMPER) TEMPER PTE LTD" and "ECR - CMC" vs "Chin Mee Chin" coexist.

### Users

| user_type | is_manager | Has outlet | Count |
|---|---|---|---:|
| ADMIN | no | yes | 1 |
| ADMIN | no | no | 5 |
| NORMAL | no | yes | 7 |
| NORMAL | no | no | 12 |
| NORMAL | yes | yes | 1 |
| NORMAL | yes | no | 1 |

- 27 users in total, 19 of them (70%) with no outlet. 3 have a phone number.
- By email domain (counts only): ebbflowgroup.com 8, prepper.com 7, temper.sg 5, gmail.com 3, live.com 1, chinmeechin.sg 1, willowrestaurant.sg 1, missiongroup.com 1.
- `auth.users` has 28 rows: 1 auth user has no `public.users` row, and no `public.users` row is missing from auth.

### Recipes

- **Status:** 155 DRAFT, 0 ACTIVE, 0 ARCHIVED. None are prep recipes and none are public.
- **Versioning:** 153 roots and 2 forks, with a maximum version of 2.
- **Ownership:** 11 recipes have no `owner_id`. 6 distinct owners hold the rest, split 100 / 30 / 9 / 2 / 2 / 1.
- **Ingredients per recipe:**

  | Ingredients | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 |
  |---|---|---|---|---|---|---|---|---|---|---|
  | Recipes | 86 | 24 | 7 | 8 | 10 | 7 | 5 | 6 | 1 | 1 |

- **Sub-recipes:** 18 links, 1 level deep, no cycles.
- **Coverage:**
  - 70 have a cached `cost_price`, and 21 of those are exactly 0.
  - 1 has `selling_price_est`.
  - 3 have an image.
  - 154 have no outlet.
  - 152 have no recipe category.
  - None has R&D started, is review-ready or has a summary.
- **BOM lines:** 227 `recipe_ingredients` rows. All of them have `unit_price`, 92 have no `supplier_id`, and 1 has non-zero wastage. None is dangling.

### Ingredients and suppliers

- **Ingredients:** 1,259 in total, all active. 1,191 come from FMH and 68 were entered manually.
  - 97.2% (1,224) have a price (`cost_per_base_unit > 0`).
  - 99.8% (1,257) have a category.
  - 94.6% (1,191) have a supplier catalogue line.
  - Only 1 (0.1%) has an allergen tag.
  - Only 136 (10.8%) are used in any recipe, so 1,123 are unused.
  - No variants are linked via `master_ingredient_id`. 32 are flagged halal.
  - Base units: pcs 676, kg 303, ml 134, g 81, l 64, unit 1.
- **Categories:** the 99 categories mix FMH-sourced ones ("Food" 180 ingredients, "Packaging / Disposable" 21) with manual ones ("DRY GOODS (FOOD)" 163, "VEGETABLE" 148, …), including operations and packaging categories that aren't food.
- **Suppliers:** 323 in total. 316 active ones come from FMH, and only 78 of those have catalogue lines. The 7 manual suppliers are all inactive.
- **Catalogue (`supplier_ingredients`):** 1,191 lines, all from FMH, all in SGD, all with a SKU. None is marked preferred, 19 have `price_per_pack = 0`, and 917 (77%) are linked to no outlet.

### Tasting

- **Sessions:** 45, dated 2026-03-03 to 2026-05-20, all with a creator and 40 with a location. 14 distinct users took part, across 68 participant rows.
- **Empty sessions:** 32 of 45 have no recipe or ingredient on the agenda. Notes exist for only 8 sessions.
- **Recipe notes:** 39 in total, all linked to a user.

  | Decision | Notes | Avg overall rating | Notes with action items |
  |---|---:|---:|---:|
  | approved | 13 | 4.89 | 5 |
  | needs_work | 4 | 4.25 | 4 |
  | rejected | 5 | — | 0 |
  | none | 17 | 4.10 | 2 |

  None of the action items is marked done.
- **Ingredient tastings:** 8 agenda rows and 0 notes.

### Menus

- **`menus` (structured model):** 6 menus, none published and 1 inactive, with 12 items in total.
- **`menus_sketch`:** 21 sketches: 1 draft and 20 archived. None is a fork. 85 items, all linked to a recipe, none with sales price, cost, icons or highlight, and 0 comments.

### Storage (bucket `prepper`, public)

| Prefix | Objects | Size | Dates |
|---|---:|---:|---|
| `tasting-note-images/` | 32 | 56 MB | 2026-02-25 → 2026-03-12 |
| `recipe-images/` | 4 | 3.2 MB | 2026-02-25 → 2026-03-12 |
| `fmh-samples/` | 3 | 22 kB | 2026-03-17 |
| `ingredient-tasting-note-images/` | 1 | 0 bytes | 2026-02-25 |

Object counts were read from `storage.objects` via SQL. The backend's storage service could not be used, because the main checkout's `.env` has no `SUPABASE_URL` or `SUPABASE_KEY`.

---

## 4. Mapping to the Mission Systems shared model

| Shared domain | Recipes tables | What Recipes uniquely owns | Alignment notes |
|---|---|---|---|
| **People** | `users`, `tasting_users`, `auth.users` | Role (`user_type`, `is_manager`), outlet scope, tasting participation | Identity should come from the suite's identity source (see §5). Recipes would keep only app-specific role and scope keyed on a shared person ID. |
| **Sites/Outlets** | `outlets` (+ `recipe_outlets`, `menu_outlets`, `outlet_supplier_ingredient`) | Brand → location tree, short codes | The manual tree (Casa Vostra, Temper, Chin Mee Chin, Willow) and the FMH entities need to be merged into the shared Sites model. Organisation is missing (see §5). |
| **Stock** | `ingredients`, `categories`, `allergens`, `ingredient_allergens` | Recipe-unit costing, wastage, halal and allergen flags | 95% of ingredients are an FMH mirror and belong in the shared item master. Recipes should reference shared items instead of copying them. |
| **Suppliers** | `suppliers`, `supplier_ingredients`, tag tables | — (all FMH-sourced) | Belongs to the shared Suppliers/catalogue domain. The prices in it feed costing. |
| **Orders** | (none; `supplier_ingredients` prices only) | — | No purchase orders or sales. `menus.display_price` and `menu_sketch_section_item.sales_price` are the only selling prices. |
| **Recipes** | `recipes`, `recipe_ingredients`, `recipe_recipes`, `recipe_images`, `recipe_categories`, tasting tables, `menus*`, `menus_sketch*` | Recipe BOM, versions, R&D tasting, menu sketches | This is Recipes' core domain and the part to publish to the suite. |
| **Guests** | none | — | No guest or customer data. |

---

## 5. Identity, Passport and organisation findings

### How identity works today
1. **Authentication: Supabase Auth (`auth.users`).**
   - Login, register, refresh and logout call Supabase directly (`backend/app/domain/supabase_auth_service.py`).
   - The frontend offers Google sign-in via `supabase.auth.signInWithOAuth({ provider: 'google' })` (`frontend/src/app/login/page.tsx:144`). On first Google login, `POST /auth/oauth-complete` provisions a local row (`backend/app/api/auth.py:164`).
2. **Token verification: `ebb-flow-tech-auth` v0.1.0.**
   - The library's `verify_token` returns only `user_id`, `email` and the raw claims. It contains no Passport, organisation or tenant logic.
   - Its design doc says explicitly that it reads no roles from `app_metadata` or `user_metadata`, and that role and org resolution stay in each app's own database. The doc cites Grapestack's `OrganizationUser` / `BrandUser` as one example.
   - The backend adds an HS256 fallback for projects without JWKS.
   - v0.1.0 is the only tag. The latest commit is from 2026-04-20.
3. **Authorisation: the local `public.users` table.**
   - `get_current_user` (`backend/app/api/deps.py`) looks up `users.id = sub`, and RLS helpers (`is_admin()`, etc.) read `users.user_type`.
   - So the source of truth is split: Supabase holds credentials and identity, and `public.users` holds role and scope.

### Passport: no evidence of an integration
| Where I looked | Finding |
|---|---|
| Repo (`git grep passport`, org, tenant) | No matches in app code, config or docs |
| `ebb-flow-tech-auth` source and docs (GitHub) | No Passport; a GitHub code search for "passport" in `Ebb-Flow-Tech` returned 0 hits |
| Backend env (`.env.example`, main `.env` keys) | Only `DATABASE_URL`, `SUPABASE_*`, `ANTHROPIC_API_KEY`, `CORS_ORIGINS`; no IdP, issuer or client settings |
| `auth.identities` providers | `email` 26, `google` 2 |
| `auth.sso_providers` / `saml_providers` / `sso_domains` | 0 / 0 / 0, so no SSO or SAML is configured |
| `raw_app_meta_data` keys | Only `provider` and `providers`; no org, tenant or role claims |
| `raw_user_meta_data` keys | Standard Google profile keys; 1 user has `custom_claims.hd` (the Google Workspace hosted domain) |

**Answer to Dani:** "We're connected to Passport, right? So the corresponding organisation would be Mission Group?" **No on both counts, as far as the code and the live project show.**
- Recipes authenticates against its own Supabase project (`kcntk…`) with email/password or Google. It is not connected to Passport.
- There is no organisation entity, so nothing maps to "Mission Group". The only "Mission Group" trace is one user whose email is on `missiongroup.com`.
- The Fly.io deployment docs name the hosting org as "Ebb & Flow Group".
- If Passport is meant to be the suite's identity provider, Recipes hasn't been migrated to it yet.

### Closest equivalent to an organisation
- The top-level `BRAND` outlets: 11 roots, each acting as an isolated tenant.
- Non-admin access is "own outlet plus parent" (`recipe_service.py:79-98`), but in practice it is decided by `owner_id`, because only 1 recipe is outlet-linked.
- Reference data (ingredients, suppliers, categories, outlets, menu sketches) is readable by every signed-in user (`USING (true)`), so it is global rather than per organisation.

### What mapping Recipes to a "Mission Group" organisation would take
1. **Identity:** make Passport (or whatever the suite's IdP is) the issuer, either as a Supabase third-party auth / OIDC provider or by verifying Passport JWTs in `ebb-flow-tech-auth`. Then map Passport subject IDs to the 27 existing `users.id` values, matching on verified email. One auth user has no profile row and should be resolved first.
2. **Organisation model:**
   - Add `organisations` (or reference the suite's org ID) and give `outlets` an `organisation_id`.
   - Backfill all 16 outlets to Mission Group, assuming all of these brands sit under it. This is a business question: see Q1.
   - Global reference tables (`ingredients`, `suppliers`, `categories`, `allergens`) need an org or shared-catalogue decision.
3. **Claims and RLS:** carry `org_id` and role in `app_metadata` (per the project's security rule) or resolve them from the shared model. Then extend `is_admin()` and similar helpers, plus the app-layer outlet scoping, to filter by organisation.
4. **Clean up outlets first:** reconcile the FMH entity outlets with the manual brand tree (see §6) so each site appears once under the org.

---

## 6. Data-quality issues

1. **Recipes without a BOM:** 86 of 155 recipes (55%) have no ingredients and no sub-recipes, and 21 have a cached cost of 0.
2. **No lifecycle use:** all recipes are DRAFT, so `ACTIVE` and `ARCHIVED` are never used. `rnd_started` and `review_ready` are always false.
3. **Outlet links are nearly absent:** 154 of 155 recipes and 19 of 27 users have no outlet. That makes the hierarchical access model mostly dormant.
4. **Duplicate site identities:** the FMH outlets (`(TEMPER) TEMPER PTE LTD`, `ECR - CMC`, `JEM/RC - CASA VOSTRA`) duplicate the manual brands (Temper, Chin Mee Chin, Casa Vostra) as unrelated roots. FMH outlets also have no `code`.
5. **Unused catalogue:** 1,123 of 1,259 ingredients (89%) are in no recipe. 238 of 316 active suppliers have no catalogue lines, and 917 catalogue lines are linked to no outlet.
6. **Zero prices:** 19 `supplier_ingredients` rows have `price_per_pack = 0`, and 35 ingredients have no `cost_per_base_unit`.
7. **Allergens effectively unpopulated:** only 1 of 1,259 ingredients is tagged.
8. **Duplicate ingredient:** "corn" appears 4 times, all manual. No `master_ingredient_id` variants are in use.
9. **Category sprawl:** 99 ingredient categories mix FMH and manual naming styles and include operations and packaging categories. Recipe categories are mostly placeholders ("Cat 2"…"Cat 13", "Cat 6" twice, "random category"), and only 3 recipes are categorised.
10. **Tasting hygiene:** 32 of 45 sessions are empty, 0 action items are marked done, and 17 of 39 notes have no decision.
11. **Missing FK constraints:**
    - `recipes.owner_id`, `recipe_ingredients.supplier_id` and `users.id → auth.users` aren't enforced. None of them is currently dangling.
    - 1 auth user has no `public.users` row.
    - 11 recipes have no owner, so under RLS they are visible and editable only by admins.
12. **Storage:**
    - The `prepper` bucket is public with no MIME or size limits, which conflicts with the "validate MIME type and size" rule; validation is backend-only.
    - There are 4 recipe-image objects but 3 `recipe_images` rows, and 32 tasting objects vs 31 rows, so there is likely 1 orphan of each.
    - There is one 0-byte object.
13. **Two menu models:** the `menus*` tables (6 menus) and `menus_sketch*` both exist. Neither is published or priced, and 20 of 21 sketches are archived.
14. **`alembic_version`** has RLS disabled. It is low risk, but it's the only public table without RLS.
15. **Doc drift:** the docs refer to a `recipe-images` bucket, but the real bucket is `prepper`, with `recipe-images/` as a folder.

---

## 7. Open questions

1. **Which org do these brands belong to?** Do all brands (Casa Vostra, Temper, Chin Mee Chin, Willow, plus the FMH companies Carlitos, Dragon Chamber, Galiena, Wine Kin) sit under "Mission Group"? Or is the org "Ebb & Flow Group", or several orgs? "Outlet A" looks like test data.
2. **What is Passport concretely?** Which issuer, protocol and claims does it use? Will the suite share one Supabase project, or will Recipes trust an external IdP?
3. **Which copy is canonical?** Should the shared model own the FMH-sourced ingredients, suppliers and prices, with Recipes keeping only references and recipe-specific overrides (wastage, recipe units)?
4. **How should the FMH entity outlets map** to the manual brand and location outlets? For example, is "ECR - CMC" a Chin Mee Chin location?
5. **What counts as production data?** Should the 86 empty recipes, placeholder recipe categories, empty tasting sessions and "Outlet A" be migrated or dropped?
6. **Which menu model wins?** Should `menus` or `menus_sketch` be the menu entity published to the suite (e.g. to POS/Orders)?
7. **Is `kcntk…` the only Recipes environment?** There is also a `fly.stage.toml`. Is staging on a separate database that also needs surveying?
8. **Is the 2026-10-28 menu-sketch activity real?** The latest `menus_sketch.updated_at` is today, while everything else stopped in June. It might be a test or an automated touch.
