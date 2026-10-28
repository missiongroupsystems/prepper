# Mission Recipes Design System

> Mission Recipes' instance of the **Mission Design System** — one design language across every Mission / Ebb & Flow product (Mission Systems, Grapestack, Beacon, Bearhug, Lighthouse, Geddit, Mission Recipes, Supadriver, SupaSchedule, Launchpad).
>
> This file is the **target contract** for Mission Recipes (the kitchen-first recipe workspace, packaged in this repo as `prepper`). The Mission language was authored for calm, editorial marketing surfaces; Mission Recipes is a dense operational app (recipe canvas, ingredients, costing, tasting sessions, outlets, versioning). Where the two pull apart, this doc records the adaptation explicitly rather than copying Mission blindly. The live implementation in `frontend/src/styles/tokens.css`, `frontend/src/app/globals.css` and `frontend/src/app/layout.tsx` is the source of truth for tokens; when this doc and the code disagree, fix whichever is wrong for the phase you're in.

The feel in one sentence: **white and warm-beige surfaces, one dark-green brand accent, hairline-thin lines, generous space on empty/onboarding surfaces and disciplined density on data surfaces, quiet motion — calm, editorial, human, never loud — while recipe/ingredient/cost status stays instantly legible.**

---

## 0. Implementation status (migration tracker)

This doc describes the **target**. Mission Recipes starts from its prior **terracotta / parchment** system (HSL tokens, three typefaces, a collectible `game-card` aesthetic). Phases below are Mission Recipes' actual state, not Mission's — most of the migration has **not** started.

| Phase | Scope | Status |
|---|---|---|
| **Redesign P1** | Foundations aligned with Workforce: tokens (`styles/tokens.css`), dark mode, variable Satoshi, system mono, MS-Recipes logos, favicon/PWA icons | ✅ done (0.1.2). Phase 2 = primitives + left-rail shell; Phase 3 = page-by-page adoption. |
| Font | Three faces (Fractul + CoFo Sans + CoFo Sans Mono) → **one family**, single swap seam | ✅ done — Polymath stand-in wired via seam vars; Fractul/CoFo/CoFo-Mono dropped, Typekit kit → `weg5tjh`. Self-host Euclid when licensed (a no-op swap). |
| 0 | Token-adherence audit (find hardcoded colors/borders/shadows/caps) | ✅ done — sweep found ~3,100 hardcoded color classes (2,559 neutral), 144 `font-bold`/`semibold`, 48 `shadow-*`, 34 `game-card`, 31 ALL-CAPS (`uppercase`), 25 heading `tracking-*`, 6 `flow-ui-*` |
| 0.5 | Tokenisation — route hardcoded **neutral** colors through semantic tokens, behavior-preserving | ✅ done (neutrals) — multi-agent sweep over 90 files: 1,178 classes → tokens, 926 `dark:` neutral pairs collapsed, neutrals 2,559 → 2 (intentional logo-on-dark swatches on the design-system page). Chromatic colors (game-card rarity, unsaved-amber, error reds, inverted black/white "Owned" badge, `prose-zinc`, ReactFlow hex props) deliberately deferred to **Phase 3** — see worklist below. |
| 1 | Color + surfaces — flip brand terracotta → **forest green**; parchment → white/beige; warm ink; warm-dark `.dark`; retire decorative gradients | 🟡 spike landed — token *values* flipped in `globals.css` (forest `--primary`/`--ring`, beige `--background`, white `--card`, warm ink, muted status palette, `--hairline` tokens, `--radius` 0.75→0.5rem, warm-dark). Decorative-gradient removal deferred to Phase 3. |
| 2 | Typography — weight band (`font-bold`/`semibold` → `font-medium`), no-ALL-CAPS sweep, central heading rules (500 + optical size-scaled tracking + `text-wrap: pretty`), collapse to **one family** | ✅ done — central `h1–h6` rule added (weight 500, size-scaled tracking, `text-wrap: pretty`); multi-agent sweep over 48 files: 135 `font-bold`/`semibold` → `font-medium`, 25 `uppercase` removed, 7 heading `tracking-*` stripped. Remaining bold/caps are deliberate: design-system type specimens + game-card titles (→ Phase 3). |
| 3 | Components — buttons & badges → fully-round pills (no shadow, colour-only hover); cards → 0.5px hairline + no shadow; hairline widths across primitives + chrome; **retire `game-card`** | 🟡 in progress — primitives done (`Button`/`Badge`/`.status-*` → pill; `Card` → `rounded-lg` + 0.5px hairline, no shadow, colour-only hover). **game-card fully retired** — CanvasTab rebuilt as hairline cards with thumbnail + neutral type tag; ~240 lines of game-card CSS removed; `flow-ui`/`mono-gradient` utilities + orphan tokens removed. Chromatic worklist done — multi-agent sweep over 57 files mapped 195 classes by role (red→`destructive`, green→`status-approved`, amber→`warning`, purple→`supplier`, blue→`status-testing`/`primary`/link), 161 `dark:` pairs collapsed; added `--warning`/`--inverse`/`--supplier` tokens; "Owned" badge → `--inverse`; date-picker accents → `--primary`. Deliberately left: star-rating amber (convention), modal scrims, `prose-zinc`, ReactFlow/chart hex, and the RightPanel ingredient/recipe type-coding accent bars (blue/green) — see follow-up. |
| 4 | Motion — remove legacy `flow-ui-hover-lift` / `flow-ui-active-scale`; status-label → pill radius | ✅ done — `flow-ui-*` utilities removed (Phase 3); `game-card` hover/lift gone; `.status-*` → pill radius; `prefers-reduced-motion` block shipped (0.0.49). |

**Decisions locked for Mission Recipes:**
- **Brand = Mission forest green** (full adoption). Terracotta is retired as the brand accent.
- **Single family = Polymath** (stand-in for Euclid Circular B). Fractul + CoFo Sans + CoFo Sans Mono are dropped.
- **`game-card` is retired**, not kept as an exception — ingredient/recipe cards rebuild as hairline cards.
- **The broad tokenisation sweep (Phase 0.5) runs as a multi-agent workflow**, fanning out per directory/screen.
- This doc is the **Mission Recipes-branded** contract; the Geddit/Mission master lives elsewhere.

**Phase 3 chromatic worklist** (what the Phase 0.5 sweep deliberately left for component work):
- **`game-card` rarity** — blue (ingredient) / green (recipe) / purple (tertiary/supplier) glows, shadows, 2px borders. Retire to hairline cards (§5).
- **Unsaved/dirty-state amber** — intentional type-coding; decide whether it becomes a `warning` status token or stays.
- **Error reds** — `bg-red-50/text-red-600` error *panels* (state, not destructive actions). Route to a `destructive`/status token.
- **Inverted "Owned" badge** — `bg-black text-white dark:bg-white dark:text-black`. No inverted-neutral token exists in the set; either add one (e.g. `--inverse` / `--inverse-foreground`) or accept the literal.
- **`prose prose-zinc dark:prose-invert`** — Tiptap/Typography theme classes; need a tokenised prose theme, not a class swap.
- **ReactFlow hex props** — `#71717a` edge stroke, `#e4e4e7` canvas bg passed as JS props (version tree). Replace with CSS-var reads.

Concrete colour/spacing values below marked _(tune in Phase 1)_ are targets to be finalised live against real screens.

---

## 1. Core principles (and the no-go list)

**We do:**
- One typeface, one **brand** accent color, two surfaces.
- Hairlines (0.5px) instead of boxes, dividers and heavy borders.
- Calm type with tight letter-spacing on headings; Light (300) body.
- Lots of whitespace on empty / onboarding surfaces; disciplined density on data surfaces.
- Quiet, scroll-driven motion that completes and gets out of the way.
- Short copy, plain language, sentence case everywhere.
- **Functional status stays legible** — chefs/operators must read recipe lifecycle, ingredient and cost state at a glance.

**We never do (no-go):**
- ❌ **No ALL-CAPS anywhere** — not in eyebrows, buttons, labels, nav, tags, or table headers. Sentence case only.
- ❌ **No second typeface.** One family for everything. (See §3.)
- ❌ **No drop shadows as decoration.** Shadows only lift a floating panel/dropdown off the canvas, very soft and low-opacity. Never on buttons or static cards.
- ❌ **No heavy borders.** Lines are 0.5px hairlines; 1px is already strong; 2px only for tiny progress tracks.
- ❌ **No pure black.** Text is warm near-black, never `#000`.
- ❌ **No bright/saturated colors as brand or chrome.** The green is deep and muted; no blue links, no gradients-as-decoration, **no collectible-card rarity glows**. *Functional status colors are the one sanctioned exception (§2.4) — and even they are desaturated.*
- ❌ **No bold body.** Body is Light (300). Bold (700) is essentially unused.
- ❌ **No rounded-everything or sharp-everything.** Pills fully round (999px); cards softly round.
- ❌ **No tight, cramped empty/onboarding sections.** If a hero/empty state feels dense, add space.

---

## 2. Color

> **Shipped in 0.1.2 (redesign Phase 1).** Values and roles now match Mission Workforce, the suite's reference app. Raw values live in `frontend/src/styles/tokens.css` (`:root` and `.dark`, the **only** place hex appears); `frontend/src/app/globals.css` maps them to Tailwind with `@theme inline`, so every utility resolves through the live token and dark mode needs no component edits.

Two tiers, as before:

- **Tier 1 — Brand & interactive chrome:** exactly one accent.
- **Tier 2 — Functional status:** a small, muted palette for operational state. Legibility, never decoration.

> **Token-naming note (changed in 0.1.2).** `--accent` / `bg-accent` / `text-accent` is now the **brand forest**, as in Workforce. The old neutral-hover meaning moved to `bg-surface-hover` (32 call sites renamed). `--primary` still exists and aliases the accent. Two shadcn-era names collide with Workforce and keep their **surface** meaning because ~140 call sites use them: `bg-muted` and `bg-secondary` are the sunken beige. For text use `text-muted-foreground` (muted deep) and `text-tertiary` (muted). Never use `text-secondary` or `text-muted` here; they resolve to surfaces.

### 2.1 Surfaces

| Token | Light | Dark | Utilities | Role |
|---|---|---|---|---|
| `--background` | `#faf9f6` | `#0d100e` | `bg-background` | Canvas, the page behind cards. |
| `--card` / `--popover` | `#ffffff` | `#141816` | `bg-card`, `bg-popover` | Lifted panels, dialogs, menus. |
| `--surface-sunken` | `#f6f5f1` | `#0f1311` | `bg-surface-sunken`, `bg-muted`, `bg-secondary` | Inputs, insets, the neutral badge, segmented tracks. |
| `--surface-hover` | ink 4% | white 5% | `bg-surface-hover` | Row, item and ghost-button hover. |
| `--surface-active` | ink 7% | white 8% | `bg-surface-active` | Pressed. |
| `--surface-selected` | `#eef2ef` | `#1b2a22` | `bg-surface-selected`, `bg-background-contrast` | Active nav item, selected rows. |

### 2.2 Text

| Token | Light | Dark | Utilities | Role |
|---|---|---|---|---|
| `--ink` | `#171717` | `#e9ece9` | `text-foreground`, `text-ink` | Primary (17.9:1). |
| `--muted-deep` | `#55534c` | `#b4bab5` | `text-muted-foreground`, `text-muted-deep` | Secondary: labels, sub-text (7.7:1). |
| `--muted` | `#6b6962` | `#9aa19c` | `text-tertiary` | Tertiary: captions, helper text, eyebrows (5.5:1). |
| `--faded` | `#8d8a82` | `#6d746f` | `text-disabled`, `text-faded` | Disabled and decorative only. |
| `--placeholder` | `#a8a59d` | `#5f6661` | `text-placeholder` | Input placeholders. |

### 2.3 Lines

| Token | Light | Dark | Utilities | Role |
|---|---|---|---|---|
| `--line` | ink 10% | white 8% | `border-line` | Quiet shell dividers. |
| `--hairline` | ink 16% | white 14% | `border-border`, `hairline*` (0.5px) | Dividers, card edges. |
| `--hairline-strong` | ink 28% | white 22% | `border-hairline-strong` | Column tops, emphasis. |
| `--input` | `#807d76` | white 34% | `border-input`, `border-control` | The perceivable 1px **control** border (4.1:1). A hairline fails as a control boundary. |

### 2.4 The brand accent — exactly one

| Token | Light | Dark | Utilities |
|---|---|---|---|
| `--accent` | `#1d3a2a` | `#7fc79a` | `bg-accent`, `text-accent`, `bg-primary`, `text-primary` |
| `--accent-foreground` | `#ffffff` | `#0f1611` | `text-accent-foreground`, `text-primary-foreground` |
| `--accent-soft` | `#eef2ef` | `#16241c` | `bg-accent-soft` (its only tint) |
| `--accent-press` | `#142a1e` | `#6ab486` | `bg-accent-press` |
| `--ring` | = accent | = accent | `ring-ring`, `:focus-visible` outline |

Spent only on its named roles: the primary button, the active/selected state, focus, and brand chrome (the logo).

### 2.5 Semantic feedback and Tier-2 status

Feedback: `--success #2f6b46`, `--warning #8a5a1f`, `--info #335a7a`, `--danger #9a3b2e`, each with a `-subtle` tint (`bg-success-subtle`, `text-danger`, …). `destructive` aliases `danger`. Success green is deliberately **not** the brand forest.

Tier-2 status pairs, each `--status-X` + `--status-X-bg`, applied with the `status-X` utility (tint background + status text): `draft` (warm neutral), `pending` (= info), `settled` (= success), `attention` (= warning), `blocked` (= danger), `alt` (purple). Recipes' domain pill classes map onto them: `status-testing` → pending; `status-approved` / `status-active` / `status-optimal` → settled; `status-archived` / `status-low` → blocked; `status-excess` → attention; `status-inactive` → sunken neutral.

The plan-29 names that components still read through `var()` (`--color-feedback-*`, `--color-text-*`, `--surface-tooltip`, `--border-strong`, `--color-scrim`, …) remain as a **legacy bridge** in `tokens.css`, aliasing the tokens above so they flip with the theme. Phase 3 retires them page by page.

### 2.6 Dark mode (shipped)

Dark is back, matching Workforce's hand-tuned map (values in the tables above).

- `@custom-variant dark (&:is(.dark *))`: the `.dark` class on `<html>` drives it, never the OS media query directly.
- Choice is **System · Light · Dark**, persisted under `THEME_STORAGE_KEY` (`mission_recipes_theme`). Nothing stored means Light. The legacy `prepper-theme` value is migrated.
- `lib/theme.ts` holds the pure rule and `THEME_BOOT_SCRIPT`, the inline `<head>` script in `app/layout.tsx` that sets `.dark` and `color-scheme` before first paint (and keeps following the OS for System). `<html suppressHydrationWarning>`.
- `components/theme/ThemeProvider.tsx` exposes `useTheme()` → `{ choice, resolvedTheme, setChoice }`. `ThemeToggle.tsx` is a radio group; it appears on the design-system page only, until Phase 2 places it in the top bar or user menu.
- `.light` and `.dark` also work as **subtree scopes** (the aliases are restated on both), which is how the design-system page shows the two themes side by side.
- Sonner toasts receive the resolved theme.

---

## 3. Typography

### 3.1 Typeface

**One family: Satoshi**, self-hosted as a **variable** font (weight axis 300–900, normal + italic) from `public/fonts/satoshi/Satoshi-Variable*.woff2`, copied from Workforce. It replaces the five static cuts. No external font host.

The seam, as in Workforce (`styles/tokens.css`):

```css
--brand-typeface-display: "Satoshi";
--brand-typeface-text:    "Satoshi";
/* → --font-sans-seam / --font-display-seam → @theme --font-sans / --font-display */
```

**Mono** is the system stack (`ui-monospace, "SF Mono", Menlo, Consolas, monospace`) for IDs, SKUs and codes only. The Geist Mono `next/font/google` import is gone. Numbers in Satoshi use **`tnum`** (the suite name; `tabular` is kept as an alias). `th`, `td` and `input[type=number]` get tabular figures by default.

### 3.2 Weight band

| Weight | Where |
|---|---|
| 400 | Body, UI text, table cells. |
| 500 | Headings, buttons, labels, emphasis, metric values. |
| 300 | Only ≥24px display moments. |

**Nothing bolder than 500.** `font-synthesis: none` stops a stray 600/700 from faking a bolder cut. The 0.1.2 sweep moved the last 15 `font-semibold`/`font-bold` uses, plus one inline `font-weight: 700` in the tasting email, to 500.

### 3.3 Two type scales

A fluid `clamp()` scale is for empty/onboarding/hero surfaces. A **compact UI scale** governs the operational app (canvas, tables, forms, detail cards) — dense screens can't use 72px heroes.

**Display scale (empty states / onboarding / hero)** — fluid, tight tracking:

| Role | Size | Weight | Tracking | Line-height |
|---|---|---|---|---|
| Hero / page H1 | `clamp(40px, 5.6vw, 72px)` | 500 | `-0.025em` | 1.04 |
| Section H2 | `clamp(30px, 3.4vw, 46px)` | 500 | `-0.02em` | 1.12 |
| Feature H3 | `clamp(26px, 2.8vw, 36px)` | 500 | `-0.018em` | 1.14 |
| Display quote | `clamp(24px, 2.6vw, 33px)` | 300 | `-0.012em` | 1.35 |
| Metric / cost value | `clamp(40px, 5vw, 64px)` | 500 | `-0.03em` | 1 |

**Compact UI scale (data surfaces — canvas, tables, panels)** — fixed sizes:

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Page title (app) | 24–28px | 500 | `-0.015em` |
| Card / panel H3 | 18–21px | 500 | `-0.01em` |
| Section label / eyebrow | 13–15px | 500 | normal (forest green) |
| Body / form text | 14–16px | 300–400 | normal |
| Table header | 12.5–13px | 500 | normal *(sentence case, never caps)* |
| Table cell | 13–14px | 400 | normal (`tnum` for numerics) |
| Caption / timestamp | 12–12.5px | 300–400 | normal |

**Shared rules:** tighter negative tracking the bigger the type; never positive tracking on headings; `text-wrap: pretty` on headings and paragraphs; **eyebrows/kickers are forest green, weight 500** (they replace ALL-CAPS labels).

**Heading letter-spacing is optical and centralised.** The global `h1–h6` rule in `globals.css` owns heading tracking — size-scaled negative values (tighter on large display, easing toward normal as headings shrink; body is `0`). Components must **not** add `tracking-*` to headings (25 such usages to clean up); the global rule is the single source.

| Heading | `letter-spacing` |
|---|---|
| `h1` | `-0.02em` |
| `h2` | `-0.014em` |
| `h3` | `-0.01em` |
| `h4`–`h6` | `-0.006em` |
| body | `0` (normal) |

### 3.4 Text color

- **Headings:** `--foreground` (warm ink) on light; `#ffffff` on dark.
- **Eyebrows / section labels:** the `eyebrow` utility — 12px, 500, `text-tertiary`. Not accent-coloured (Workforce rule since 0.1.2).
- **Ledes / secondary intros:** `--muted-foreground`.
- **Body:** `--muted-foreground` when supporting; `--foreground` at 300 for long prose.
- **Captions / timestamps / meta:** lightest warm grey.
- **Inline links:** `--foreground` with a 0.5px bottom border; hover → `--primary`. **Never blue.**

Rule of thumb: **ink heading, warm-grey supporting copy, green only for the label and interactive bits.** Status hues (§2.4) appear *only* inside badges/chips.

### 3.5 Alignment

Default **left**. Center is reserved for whole-section "moments" — empty-state hero centers, closing CTA bands. **Never center long paragraphs or multi-line body.** App/data surfaces are always left-aligned.

---

## 4. Layout, spacing & sizing

### 4.1 Spatial tokens

App surfaces use the existing shell gutters (`p-4 md:p-6 lg:p-8`). Marketing/standalone-page gutters (`--pad-x: 56px`, `--content-max: 1320px`) apply only if Mission Recipes grows public/marketing pages.

### 4.2 Vertical rhythm — two registers

- **Empty / onboarding:** generous — big content wants big gaps (44–110px); mobile compresses to ~80–100px.
- **Operational / data (the default in Mission Recipes):** disciplined. Page padding `p-4 md:p-6 lg:p-8`; card padding `p-6`; section gaps `mb-6`/`mb-8`; tight table rows. Air comes from hairlines and whitespace *within* a dense grid, not big voids.

### 4.3 Corner radii

| Token | Value | Utility | Used on |
|---|---|---|---|
| `--radius-sm` | 6px | `rounded-sm` | Small chips, inline controls. |
| `--radius-md` | 8px | `rounded-md` | Inputs, menu items. |
| `--radius-lg` | 12px | `rounded-lg` | Cards. |
| `--radius-xl` | 16px | `rounded-xl` (and `rounded-2xl`) | Dialogs, side panels, popovers. |
| `--radius-pill` | 999px | `rounded-pill` | Buttons, badges, avatars, segmented controls. |

The scale moved up one step in 0.1.2 to match Workforce: `rounded-lg` was 8px and is now 12px, `rounded-xl` was 12px and is now 16px. Phase 2 primitives choose the right step per component.

### 4.4 Breakpoints

`≤980px` multi-col grids → one column · `≤760px` sections compress. App data tables get horizontal scroll / column priority rather than reflow.

---

## 5. Components

Primitives live in `frontend/src/components/ui/` (`Button`, `Card`, `Badge`, `Modal`, `Input`, `Select`, `Switch`, `Checkbox`, `Textarea`, `EditableCell`, …). Migrate toward Mission shapes:

- **Buttons → pills.** Fully round (`999px`). Primary: forest fill, white text, `14px 28px`, 15.5px/500. Buttons shift opacity/background on hover (`0.2s ease`) — they **don't** move, scale, or cast shadows. Default CTA copy: short, sentence-case verbs.
- **Cards.** White or beige fill, 0.5px hairline border, no shadow. Soft radius (~8–12px). **Retire `game-card`** (the 34 collectible-card usages, blue/green rarity, glows, 2px borders, `game-card-hover` lift + shadow) — rebuild ingredient/recipe cards as plain hairline cards. The ingredient↔recipe distinction is carried by a small label/tag, not a rarity glow.
- **Status badges/chips.** Pill-shaped, Tier-2 muted status color + tint bg (§2.4), sentence case, weight 500. Convert the current `.status-*` utilities from `border-radius: 0.375rem` to pill (`999px`). The single place functional hues appear.
- **Tables.** Hairline row separators (not boxes), sentence-case 500 headers, 400 cells, `tnum` numerics, generous row height. No zebra fills.
- **Top nav (`TopNav` / `TopAppBar`).** Beige (same as the canvas), parted from content by a 0.5px hairline. Active item: soft forest highlight + `text-foreground` 500; inactive: `text-muted-foreground` 400, hover → foreground. (Migrates the 0.0.40 `bg-primary` active-tab convention to forest.)
- **Scrollbars.** Thin and track-less — transparent gutter, a subtle padding-inset rounded thumb (`--muted-foreground` at low alpha). Already track-less in `globals.css`; keep.

---

## 6. Glassmorphism

The one optional "effect," used with restraint over a dark accent canvas only. **Never on flat light/beige surfaces** (nothing to blur — use a solid card + hairline instead). In Mission Recipes, glass is essentially unused — operational data surfaces sit on white/beige and use solid cards. Reserve for any future dark hero/empty surface; blur 14–18px, ~14% white fill, 0.5px translucent border, white text. No colored glass, no thick borders, no stacked layers.

---

## 7. Icons

Stroke-based, single-color, one drawing language. Mission Recipes uses **`lucide-react`** (thin-line, Mission-compatible). Keep `fill="none"`, thin strokes, `round` linejoin/linecap. On light: ink stroke. On dark: `#ffffff`. Forest green is for icon **chips** (the rounded tile behind an icon), not the glyph itself. **Avoid filled/duotone/multicolor variants. No emoji as UI icons** (note: the menu-sketch dish icon-tags use emoji as *content/data*, which is fine — that's not chrome).

---

## 8. Motion

**Feedback, not scenery.** Tokens in `tokens.css`:

| Token | Value | Use |
|---|---|---|
| `--dur-quick` | 120ms | Hover, press, toggle. |
| `--dur-base` | 160ms | Menus, popovers, segment moves. |
| `--dur-entrance` | 200ms | Dialogs, side panels, toasts. |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances. |
| `--ease-out-soft` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Small UI moves. |

Use them as `duration-(--dur-quick)` and `ease-out-expo`. **Reduced motion is mandatory**: the `@media (prefers-reduced-motion: reduce)` block in `globals.css` neutralises transitions, animations and smooth scroll. Any new motion must respect it.

---

## 9. Shadows

Resting surfaces use a hairline, not a shadow. Ink-tinted, never black, with dark variants:

| Token | Utility | Use |
|---|---|---|
| `--shadow-card` | `shadow-card`, `shadow-elevation-1` | The chosen segment, a barely-lifted chip. |
| `--shadow-raised` | `shadow-elevation-2` | Dropdowns (legacy name). |
| `--shadow-pop` | `shadow-pop`, `shadow-elevation-3` | Dialogs, side panels, popovers. |

---

## 10. File structure

```
frontend/
├── public/
│   ├── fonts/satoshi/        # Satoshi-Variable.woff2, Satoshi-VariableItalic.woff2
│   ├── logo/                 # MS-Recipes-blk-*.svg (7 lockups) + inlinelong.png (email)
│   └── icons/                # icon-192, icon-512, icon-maskable-512 (PWA)
├── src/
│   ├── styles/tokens.css     # raw tokens: :root/.light + .dark (only place for hex) + aliases
│   ├── app/
│   │   ├── globals.css       # @font-face, @custom-variant dark, @theme inline map, base, utilities
│   │   ├── layout.tsx        # no-flash theme script, metadata, Providers, TopNav
│   │   ├── icon.svg · apple-icon.png · manifest.ts
│   │   └── design-system/    # page.tsx + _sections/ (brand, themes, tokens, type, components)
│   ├── components/
│   │   ├── brand/BrandLogo.tsx      # full | short | mark, currentColor
│   │   ├── theme/                   # ThemeProvider (useTheme), ThemeToggle
│   │   ├── ui/                      # primitives (Phase 2 restyles)
│   │   └── layout/                  # TopNav, panels, tabs (Phase 2 replaces the shell)
│   └── lib/
│       ├── theme.ts          # choices, resolve rule, THEME_BOOT_SCRIPT
│       └── storage-keys.ts   # THEME_STORAGE_KEY + legacy migration
```

The shell tokens Phase 2 consumes are already defined: `--shell-rail` 232px (`w-rail`), `--shell-rail-narrow` 64px, `--shell-bar` 58px (`h-bar`), `--content-max` 1080px (`max-w-content`), `--content-pad-x/-y`.

---

## 11. Best practices

1. **Use tokens, never hardcoded colors** (`text-muted-foreground` / `bg-card`, not `text-gray-500` / `bg-white`). Phase 0 audits and fixes the ~3,100 violations.
2. **Brand green is chrome; status hues are data.** Never style a button or link with a status color, never a badge with the brand accent.
3. **Sentence case, always.** No ALL-CAPS, including table headers and tags (31 to fix).
4. **Hairline before border, nothing before shadow.**
5. **Body is 400, headings are 500, nothing bolder.**
6. **Pick the right scale** — display for empty/onboarding, compact UI for the canvas and data.
7. **Status must stay legible** — desaturated, but never so quiet a chef can't scan recipe/ingredient/cost state.
