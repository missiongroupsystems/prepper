# Frontend Rules (Next.js 15)

## Data flow
- All server data flows through TanStack Query hooks in `src/lib/hooks/` — no local state for server data.
- One hook file per resource; mutations invalidate related caches.
- Use the typed fetch wrapper in `src/lib/api.ts` — don't call `fetch()` directly.

## Canvas + autosave
- Debounced autosave on every editable field — no save buttons.
- Canvas tabs: `canvas | overview | ingredients | costs | instructions | tasting | outlets | versions`.
- Global UI state via `useAppState()` (selected recipe, active tab, auth).

## Interactions
- Drag-and-drop via `dnd-kit` — wrap in AppShell's `DndContext`. Don't reinvent with HTML5 DnD.
- Version tree visualization uses `@xyflow/react` (ReactFlow).
- Inline editing via the `EditableCell` component.
- Modals for complex forms only (suppliers, outlets).

## TypeScript
- Types in `src/lib/types/index.ts`.
- Never `any` — use proper types or `unknown`.

## Rich text
- Tiptap v3 (Bold/Italic/Underline/Strike/Link toolbar) for menu-wide notes — don't add other editor libraries.

## Images
- Recipe images go through Supabase Storage (`recipe-images` bucket) via the backend.
- DALL-E 3 image generation via `/api/generate-image` (frontend route handler).
