# Plan 26: Row-Level Security (RLS)

**Status**: ✅ Complete
**Priority**: High
**Dependencies**: User authentication, `is_manager` field, `tasting_users` join table, Supabase Postgres
**Owner**: Engineering

---

## Overview

Add PostgreSQL Row-Level Security (RLS) to all 29 tables so that access rules are enforced at the database layer, not just in application code. Policies mirror the existing application-level permission model (admin / manager / normal user). RLS applies only to direct Supabase client connections (`authenticated` role); the FastAPI backend connects via the service role which carries `BYPASSRLS` by default.

---

## Permission Model

| Role | Criteria | Access |
|------|----------|--------|
| Admin | `user_type = 'admin'` | Full access to all tables |
| Manager | `user_type = 'normal'` AND `is_manager = true` | Read/write shared reference data; manage menus |
| Normal | `user_type = 'normal'` AND `is_manager = false` | Own recipes; sessions they created or participate in; own tasting notes |
| Anon / unauthenticated | No JWT | No access (no policies created) |

---

## Helper Functions

Eight reusable functions in the `public` schema, applied in dependency order:

| Function | Returns | Description |
|----------|---------|-------------|
| `current_user_id()` | `text` | `auth.uid()::text` — Supabase JWT user ID |
| `is_admin()` | `bool` | `user_type = 'admin'` for the current user |
| `is_manager_or_admin()` | `bool` | `user_type = 'admin'` OR `is_manager = true` |
| `can_access_recipe(int)` | `bool` | Owner OR `is_public = true` OR admin — read gate |
| `owns_recipe(int)` | `bool` | Owner OR admin — write gate |
| `can_access_tasting_session(int)` | `bool` | Creator OR participant (`tasting_users`) OR admin — read gate |
| `owns_tasting_session(int)` | `bool` | Creator OR admin — write gate |
| `can_access_menu(int)` | `bool` | Creator OR manager/admin — read + write gate |

---

## Table Policy Summary

| Tables | SELECT | INSERT / UPDATE / DELETE |
|--------|--------|--------------------------|
| `recipes` + sub-resources | `can_access_recipe` | `owns_recipe` |
| `ingredients`, `categories`, `suppliers` | All authenticated users | Manager or admin |
| `outlets`, `allergens` | All authenticated users | Admin only |
| `tasting_sessions` | `can_access_tasting_session` | `owns_tasting_session` |
| `tasting_notes`, `tasting_note_images` | Session participant | Author or admin |
| `menus`, `menu_sections`, `menu_items`, `menu_outlets` | `can_access_menu` | Creator or admin |
| `menus_sketch` | All authenticated users | Manager or admin |
| `users` | Own row or admin | Admin only |

---

## Files Created / Modified

### Migration
- `backend/alembic/versions/h1i2j3k4l5m6_add_row_level_security.py`
  - Merges 3 open heads: `2682e67b2782`, `31b321f97368`, `b3c4d5e6f7g8`
  - Creates all 8 helper functions
  - Enables RLS + creates policies on all 29 tables
  - `downgrade()` drops all policies and disables RLS via `pg_policies`

### Helper Scripts
- `backend/scripts/helpers/__init__.py`
- `backend/scripts/helpers/current_user_id.py`
- `backend/scripts/helpers/is_admin.py`
- `backend/scripts/helpers/is_manager_or_admin.py`
- `backend/scripts/helpers/can_access_recipe.py`
- `backend/scripts/helpers/owns_recipe.py`
- `backend/scripts/helpers/can_access_tasting_session.py`
- `backend/scripts/helpers/owns_tasting_session.py`
- `backend/scripts/helpers/can_access_menu.py`
- `backend/scripts/helpers/apply_all.py` — applies all helpers in dependency order

### Config Fix
- `backend/app/config.py` — `env_file` changed from relative `".env"` to absolute `Path(__file__).parent.parent / ".env"` so settings resolve correctly regardless of CWD

---

## Applying the Migration

```bash
cd backend
source venv/bin/activate

# Run the migration (requires PostgreSQL / Supabase DATABASE_URL)
alembic upgrade head
```

---

## Re-applying Helper Functions (without migration)

If you need to update a helper function independently of a migration:

```bash
cd backend
source venv/bin/activate

# Apply all helpers in one go
python -m scripts.helpers.apply_all

# Apply a single helper
python -m scripts.helpers.is_admin
```

> **Note**: `DATABASE_URL` must point to your Supabase PostgreSQL instance. The scripts detect SQLite and exit early with an error.

---

## Testing Instructions

### Prerequisites

1. `DATABASE_URL` set to your Supabase project (stage or prod)
2. Three test user accounts set up in Supabase Auth + the `users` table:
   - **Admin**: `user_type = 'admin'`
   - **Manager**: `user_type = 'normal'`, `is_manager = true`
   - **Normal**: `user_type = 'normal'`, `is_manager = false`
3. Migration applied: `alembic upgrade head`
4. Helper functions applied: `python -m scripts.helpers.apply_all`

### How to Test

Use the **Supabase Table Editor** or a **SQL editor** connected with a user JWT (not the service role) to simulate each role. Alternatively, use the Supabase REST API with a user access token.

To get a user JWT for testing via SQL:
```sql
-- In Supabase SQL editor, set the role to authenticated and inject a user ID
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claim.sub = '<user-uuid-here>';
```

### Test Matrix

Use ✅ for pass, ❌ for fail.

#### Recipes

| Test | Admin | Manager (non-owner) | Normal (owner) | Normal (non-owner) |
|------|-------|---------------------|----------------|--------------------|
| SELECT own recipe | ✅ | ✅ | ✅ | ❌ Hidden |
| SELECT public recipe | ✅ | ✅ | ✅ | ✅ |
| SELECT private recipe (non-owner) | ✅ | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| INSERT recipe | ✅ | ✅ | ✅ | ✅ |
| UPDATE own recipe | ✅ | ❌ Error | ✅ | ❌ Error |
| UPDATE other's recipe | ✅ | ❌ Error | ❌ Error | ❌ Error |
| DELETE own recipe | ✅ | ❌ Error | ✅ | ❌ Error |

#### Ingredients / Suppliers / Categories (shared reference data)

| Test | Admin | Manager | Normal |
|------|-------|---------|--------|
| SELECT any ingredient | ✅ | ✅ | ✅ |
| INSERT ingredient | ✅ | ✅ | ❌ Error |
| UPDATE ingredient | ✅ | ✅ | ❌ Error |
| DELETE ingredient | ✅ | ✅ | ❌ Error |

#### Tasting Sessions

| Test | Admin | Creator | Participant | Non-participant |
|------|-------|---------|-------------|-----------------|
| SELECT session | ✅ | ✅ | ✅ | ❌ Hidden |
| INSERT session | ✅ | ✅ | ✅ | ✅ |
| UPDATE session | ✅ | ✅ | ❌ Error | ❌ Error |
| DELETE session | ✅ | ✅ | ❌ Error | ❌ Error |

#### Menus

| Test | Admin | Manager (creator) | Manager (non-creator) | Normal |
|------|-------|-------------------|-----------------------|--------|
| SELECT menu | ✅ | ✅ | ✅ | ❌ Hidden |
| INSERT menu | ✅ | ✅ | ✅ | ❌ Error |
| UPDATE menu | ✅ | ✅ | ✅ | ❌ Error |
| DELETE menu | ✅ | ✅ | ❌ Error | ❌ Error |

#### Menu Sketches

| Test | Admin | Manager | Normal |
|------|-------|---------|--------|
| SELECT any sketch | ✅ | ✅ | ✅ |
| INSERT sketch | ✅ | ✅ | ❌ Error |
| UPDATE sketch | ✅ | ✅ | ❌ Error |

### Regression Checks

After applying RLS, verify the FastAPI backend still works normally (service role bypasses RLS):

- [ ] `GET /api/v1/recipes` returns all recipes for admin via API
- [ ] `POST /api/v1/recipes` creates a recipe successfully
- [ ] `GET /api/v1/ingredients` returns all ingredients
- [ ] `GET /api/v1/tasting-sessions` returns sessions the user can access
- [ ] `GET /api/v1/menu-sketches` returns all sketches
- [ ] Helper script `python -m scripts.helpers.apply_all` runs without error against Supabase

---

## Key Notes

- **Silent filtering on SELECT**: RLS does not return an error for unauthorised reads — it simply omits rows the policy rejects. A normal user querying `SELECT * FROM recipes` only gets back rows they own or that are public.
- **Error on write**: INSERT / UPDATE / DELETE that violates a `WITH CHECK` policy returns a Postgres error.
- **`FORCE ROW LEVEL SECURITY` not set**: The table-owning role (FastAPI service connection) still bypasses RLS — intentional for backend correctness.
- **Re-running helpers is safe**: All functions use `CREATE OR REPLACE FUNCTION` — idempotent.
- **Alembic multi-head merge**: `down_revision` is a tuple of 3 revision IDs; Alembic treats it as a merge point with a single head going forward.
