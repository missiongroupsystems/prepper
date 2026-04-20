# Performance & Clean Code Rules

Apply to all code in this repository. These are non-negotiable baseline rules — violating any of them is a review blocker.

## Database

- **Fetch only needed columns and rows.** Never `SELECT *`, never load a full table/collection when a subset suffices. Push projection, filtering, pagination, and sorting into the query — not into application-side loops.
- **Index-aware queries.** When adding a new query pattern on a large table, confirm an index supports it (or add one in the same change).

## N+1 queries

- **Always check for N+1 on both backend and frontend.** A loop that issues one query per item is an N+1, whether it's an ORM lazy-load, a `.forEach(async ...)` fetch, or a per-row API call from a list view.
- Resolve by batching (`IN (...)`, `WHERE id = ANY(...)`), eager-loading/joins, or a single bulk endpoint. Never paper over with caching.

## Frontend API calls

- **Do not call the same API multiple times within a short window** unless the underlying data genuinely changed. Deduplicate via React Query / SWR / shared context, debounce user-triggered calls, and hoist shared data to a common ancestor.
- **Never mount-fetch the same resource in multiple sibling components** — lift the fetch up or use a cached query key.

## No polling

- **Do not introduce polling loops** (`setInterval`, recursive `setTimeout`, cron-style refetch) for client or server code. Use realtime subscriptions, websockets, SSE, webhooks, or on-demand refresh driven by user action.
- If a feature seems to require polling, surface it and discuss before implementing.

## File size

- **Code files should be ≤ 500 lines** (up to ~600 lines in exceptional cases with clear justification).
- When a file approaches the limit, split by responsibility: extract hooks, sub-components, helpers, or sub-modules. Don't let a single file accumulate mixed concerns.

## When editing existing code

- If you touch a file that already violates these rules (e.g. a 900-line component, a `SELECT *`, a polling loop), surface the violation to the user — do not silently expand the problem.

## Universal performance baseline

- **All list endpoints must paginate.** No unbounded `LIMIT` — every collection read exposes `limit` / `offset` (or cursor) with a sane server-enforced max.
- **Cache only after measuring.** Caching is not a fix for bad queries, N+1s, or missing indexes — profile first, then cache with explicit invalidation.
- **Don't block the event loop / main thread.** No sync crypto, sync fs, or heavy compute on the request path. Use `asyncio` primitives, worker threads, or background jobs for CPU-bound work.
- **Frontend: lazy-load heavy deps and routes.** Use `next/dynamic` (or route-level code splitting) for editors, chart libs, ReactFlow, Tiptap, etc. — don't bloat the initial bundle.
