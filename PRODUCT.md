# Product

## Register

product

## Users

Chefs, kitchen operators, and the finance/ops people who review their numbers. Primary users work in or around a professional kitchen, often non-technical, building and maintaining recipes under time pressure. Secondary users (finance, operations) read the structured output (costs, margins, wastage) and need to trust it. Hierarchical, multi-outlet organisations: admins oversee everything; normal users are scoped to the outlets in their hierarchy.

The job to be done: turn a dish in someone's head into a living, costed, versioned recipe without fighting forms or thinking about data models. On any given screen the primary task is direct manipulation of one recipe — drag in ingredients, reorder steps, adjust quantities — and see cost, wastage, and margin update immediately.

## Product Purpose

Prepper is a kitchen-first recipe workspace. A recipe is not a database record; it's a living object on a "recipe canvas" with one dish in focus at a time. Everything else (ingredient library, instructions, costing) exists to support that active context. The product separates authoritative data (ingredients, quantities, yields) from derived representations (formatted instructions, cost breakdowns), so chefs get an effortless tactile surface while finance gets reliable structured data.

Success: a non-technical chef can build and maintain a recipe end-to-end without ever pressing "Save" or navigating a wizard, and the resulting cost/wastage/margin numbers are trustworthy enough for finance to act on.

## Brand Personality

Warm, tactile, hands-on. The interface should feel like a physical workspace, not an admin panel: direct manipulation, immediate visual feedback, drag-and-drop over forms. Warmth comes from the terracotta/parchment palette, generous touch surfaces, and motion that responds to the user's hand — not from decoration. Confident and unobtrusive: the tool stays out of the way so the dish is the hero.

Three words: **warm, tactile, immediate.**

## Anti-references

- **Generic SaaS dashboard.** No cookie-cutter card-grid + hero-metric admin-panel look. No same-sized icon-heading-text cards repeated endlessly. The canvas is a workspace, not a metrics dashboard.
- Form-modal-submit flows where direct manipulation would do. Modals are reserved for genuinely complex forms (suppliers, outlets); the canvas itself is never a form.
- Save buttons. Autosave is the law.

## Design Principles

1. **Clarity, immediacy, reversibility.** No save buttons, only autosave. Every edit reflects instantly and can be undone. State is visible, never hidden.
2. **Direct manipulation over forms.** Recipes are living objects you drag, reorder, and edit in place. Reach for a modal only when a flow is genuinely complex.
3. **One dish in the spotlight.** The active recipe owns the canvas; supporting surfaces (ingredient library, costing, versions) orbit it without stealing focus.
4. **Authoritative data, derived views.** Keep the source of truth (quantities, yields, wastage) clean; formatted instructions and cost breakdowns are renderings of it, never the other way around.
5. **Trustworthy by construction.** Costing, wastage, and access scope must be correct and legible — finance acts on these numbers, so the UI must never misrepresent them.

## Accessibility & Inclusion

Target WCAG AA: body text ≥4.5:1, large text ≥3:1, visible keyboard focus (the global `:focus-visible` ring is terracotta). Full light/dark theme parity. Drag-and-drop is the primary interaction but must not be the *only* path — keyboard and click affordances should reach the same outcomes. Respect `prefers-reduced-motion` for all canvas transitions. Numeric inputs use `inputMode="decimal"` for kitchen/mobile use.
