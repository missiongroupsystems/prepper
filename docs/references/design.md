# RecipeRep Design System

> RecipeRep's instance of the **Mission Design System** — one design language across every Mission / Ebb & Flow product (Mission Systems, Grapestack, Beacon, Bearhug, Lighthouse, Geddit, RecipeRep, Supadriver, SupaSchedule, Launchpad).
>
> This file is the **target contract** for RecipeRep (the kitchen-first recipe workspace, packaged in this repo as `prepper`). The Mission language was authored for calm, editorial marketing surfaces; RecipeRep is a dense operational app (recipe canvas, ingredients, costing, tasting sessions, outlets, versioning). Where the two pull apart, this doc records the adaptation explicitly rather than copying Mission blindly. The live implementation in `frontend/src/app/globals.css` and `frontend/src/app/layout.tsx` is the source of truth for tokens; when this doc and the code disagree, fix whichever is wrong for the phase you're in.

The feel in one sentence: **white and warm-beige surfaces, one dark-green brand accent, hairline-thin lines, generous space on empty/onboarding surfaces and disciplined density on data surfaces, quiet motion — calm, editorial, human, never loud — while recipe/ingredient/cost status stays instantly legible.**

---

## 0. Implementation status (migration tracker)

This doc describes the **target**. RecipeRep starts from its prior **terracotta / parchment** system (HSL tokens, three typefaces, a collectible `game-card` aesthetic). Phases below are RecipeRep's actual state, not Mission's — most of the migration has **not** started.

| Phase | Scope | Status |
|---|---|---|
| Font | Three faces (Fractul + CoFo Sans + CoFo Sans Mono) → **one family**, single swap seam | 🟡 in progress — Polymath stand-in wired via seam vars; Fractul/CoFo/CoFo-Mono dropped, Typekit kit → `weg5tjh` (Phase 1 spike). Self-host Euclid when licensed. |
| 0 | Token-adherence audit (find hardcoded colors/borders/shadows/caps) | ✅ done — sweep found ~3,100 hardcoded color classes (2,559 neutral), 144 `font-bold`/`semibold`, 48 `shadow-*`, 34 `game-card`, 31 ALL-CAPS (`uppercase`), 25 heading `tracking-*`, 6 `flow-ui-*` |
| 0.5 | Tokenisation — route hardcoded **neutral** colors through semantic tokens, behavior-preserving | ✅ done (neutrals) — multi-agent sweep over 90 files: 1,178 classes → tokens, 926 `dark:` neutral pairs collapsed, neutrals 2,559 → 2 (intentional logo-on-dark swatches on the design-system page). Chromatic colors (game-card rarity, unsaved-amber, error reds, inverted black/white "Owned" badge, `prose-zinc`, ReactFlow hex props) deliberately deferred to **Phase 3** — see worklist below. |
| 1 | Color + surfaces — flip brand terracotta → **forest green**; parchment → white/beige; warm ink; warm-dark `.dark`; retire decorative gradients | 🟡 spike landed — token *values* flipped in `globals.css` (forest `--primary`/`--ring`, beige `--background`, white `--card`, warm ink, muted status palette, `--hairline` tokens, `--radius` 0.75→0.5rem, warm-dark). Decorative-gradient removal deferred to Phase 3. |
| 2 | Typography — weight band (`font-bold`/`semibold` → `font-medium`), no-ALL-CAPS sweep, central heading rules (500 + optical size-scaled tracking + `text-wrap: pretty`), collapse to **one family** | ❌ not started |
| 3 | Components — buttons & badges → fully-round pills (no shadow, colour-only hover); cards → 0.5px hairline + no shadow; hairline widths across primitives + chrome; **retire `game-card`** | ❌ not started |
| 4 | Motion — remove legacy `flow-ui-hover-lift` / `flow-ui-active-scale`; status-label → pill radius | 🟡 partial — mandatory `prefers-reduced-motion` block shipped (0.0.49); `flow-ui-*` utilities + `game-card` motion still present |

**Decisions locked for RecipeRep:**
- **Brand = Mission forest green** (full adoption). Terracotta is retired as the brand accent.
- **Single family = Polymath** (stand-in for Euclid Circular B). Fractul + CoFo Sans + CoFo Sans Mono are dropped.
- **`game-card` is retired**, not kept as an exception — ingredient/recipe cards rebuild as hairline cards.
- **The broad tokenisation sweep (Phase 0.5) runs as a multi-agent workflow**, fanning out per directory/screen.
- This doc is the **RecipeRep-branded** contract; the Geddit/Mission master lives elsewhere.

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

RecipeRep uses a **two-tier** color model. This is the central adaptation of Mission for an operational app.

- **Tier 1 — Brand & interactive chrome:** exactly one accent. Mission's restraint applies in full.
- **Tier 2 — Functional status:** a small, desaturated, warm palette reserved for operational state (recipe lifecycle, ingredient status, inventory/cost health). It exists for legibility, never decoration.

> **Token-naming note (RecipeRep ≠ Geddit):** RecipeRep's brand token is **`--primary`** (with `--ring`), and its existing `--accent` token is a *neutral warm surface*, not the brand. Mission/Geddit name the brand `--accent`. Keep RecipeRep's names — flip `--primary`/`--ring` to forest green; leave `--accent` as the neutral surface it already is. Don't blind-rename or every `bg-accent` flips visually.

### 2.1 The brand accent — exactly one

```
--primary: 147 33% 17%;   /* deep, muted forest green ≈ #1d3a2a */   (tune in Phase 1)
--ring:    var(--primary);
```

One brand accent for the entire system. Used for: primary pill buttons, eyebrows/kickers, active states (canvas tabs, active drop zones, view-mode toggles), hover arrows, links-on-hover, focus rings, small interactive marks. It is **seasoning, not a flood** — on light pages it appears only in eyebrows, buttons, and tiny interactive marks.

**Replaces the legacy terracotta primary** (`15 65% 50%`). Every place that reads `--primary` / `--ring` (buttons, focus rings, canvas active/drop states from 0.0.49) inherits forest green automatically.

### 2.2 Neutrals — whites, warm beiges, warm greys

Two surfaces, warm ink-greys, one warm near-black. The greys are **warm** (a hint of stone/clay), never cold. Tokens stay HSL.

**App-shell convention (RecipeRep):** RecipeRep keeps its **top-nav shell** (`TopNav` + `TopAppBar`, `flex h-dvh flex-col`), not Geddit's sidebar. The beige-canvas / white-card relationship still holds: the **warm beige is the canvas** (page ground + top bar share one tone), and **white cards are raised on top**. The top bar is parted from content by a 0.5px hairline. Geddit's sidebar specifics are N/A here.

| Token | Current (HSL) | Target (HSL ≈ hex) | Role |
|---|---|---|---|
| `--background` (canvas) | `40 30% 97%` parchment | `48 20% 96%` ≈ `#f6f5f1` warm beige | App-shell ground — top bar + page. |
| `--card` / `--popover` | `40 25% 96%` cream | `0 0% 100%` `#ffffff` | Raised surfaces (cards, dropdowns, dialogs). |
| `--foreground` (ink) | `220 20% 13%` cool | `40 6% 11%` ≈ `#171717` warm | Primary text. Stands in for black. |
| `--muted-foreground` | `0 0% 55%` | `48 5% 41%` ≈ `#6b6962` warm grey | Secondary text, ledes, captions. |
| `--secondary` / `--muted` / `--accent` | warm creams `35 15–20% 92–94%` | warm beige tints (retune toward `#efeee9`) | Quiet fills, hover grounds. |
| `--border` / `--input` | `35 15% 85%` solid 1px | hairline rgba (see §2.3), 0.5px | Dividers, table lines, inputs. |

Rhythm comes from alternating white ↔ beige ↔ dark-green, never from stacking grey boxes. This **replaces the legacy parchment (`40 30% 97%`) surfaces.**

### 2.3 Hairlines

```
--hairline:        hsl(40 6% 11% / 0.16);   /* default dividers — tinted ink */
--hairline-strong: hsl(40 6% 11% / 0.28);   /* column tops, emphasis */
```

Tinted ink at low opacity, never solid grey. On dark surfaces use white at `0.16`–`0.45`. Default rendered weight **0.5px**. These replace Tailwind `border` usage on cards, tables, and dividers (currently a solid `--border`). New tokens to add in Phase 3.

### 2.4 Functional status palette (Tier 2)

Recipe/ingredient/cost state must be readable at a glance, so RecipeRep keeps a status palette — but **re-tuned into Mission's muted, warm, desaturated register**. The token *names* and `.status-*` utilities stay; only their *values* change. Lower saturation than legacy; hues warm-shifted; each still distinguishable. _(values tune in Phase 1)_

Used **only** by status badges/labels and health indicators — never as page chrome, buttons, or links.

| Semantic (RecipeRep token) | Legacy (HSL) | Target — muted/warm | Applies to |
|---|---|---|---|
| `--status-draft` (slate) | `220 10% 50%` | warm grey `30 6% 52%` | recipe draft, inactive |
| `--status-testing` (teal) | `160 50% 40%` | muted teal `185 28% 40%` | testing / in-progress |
| `--status-approved` (green) | `140 50% 35%` | sage `145 30% 38%` | approved, active, optimal |
| `--status-low` (red) | `0 70% 47%` | brick `8 45% 46%` | low, archived, error |
| `--status-excess` (amber) | `35 80% 50%` | ochre `38 48% 48%` | excess, warning |

Each keeps its `-bg` (tint) pair as today. **Note the deliberate distinction:** Tier-2 "approved" sage is *not* the same as the Tier-1 brand forest green — status green and brand green must stay visually separable so a green badge never reads as an interactive element. Recipe lifecycle (draft → testing → approved → archived), ingredient (active/inactive) and inventory (optimal/low/excess) all map through this table and keep their `.status-*` classes.

### 2.5 Dark sections (inverted) & dark mode

**Dark sections** (empty/onboarding surfaces only): full dark-green canvas (`background: hsl(var(--primary))`). Headings `#ffffff`; body white at reduced alpha (`0.78` ledes, `0.68` secondary, `0.72` kickers); hairlines/pill outlines white `0.45`; inverted pills near-solid white `0.94` with forest-green text.

**Dark mode (kept, re-tuned).** RecipeRep retains its full user-toggled light/dark theme — no feature regression (the `prepper-theme` localStorage toggle + `.dark` class on `<html>` stays). The `.dark` tokens re-tune to Mission's **warm-dark** palette _(tune in Phase 1)_:

| Token | Current (dark) | Target (dark) |
|---|---|---|
| `--background` | `220 20% 8%` cool | warm near-black `40 6% 8%` ≈ `#161512` |
| `--card` | `220 15% 12%` | one step up, warm `42 6% 10%` ≈ `#1d1c18` |
| `--foreground` | `0 0% 95%` | white at full / alpha tiers |
| `--primary` (brand) | terracotta lifted | forest green lifted for contrast |
| `--border` / hairlines | `220 15% 20%` | white `0.12`–`0.2` |

Functional status colors lighten for contrast on dark, as today.

---

## 3. Typography

### 3.1 Typeface

**One typeface, one family, via a single swap seam.** RecipeRep today ships **three** faces — `fractul-variable` (headings/display), `cofo-sans-variable` (body/UI), `cofo-sans-mono-variable` (numerics) — loaded via Adobe Typekit kit `syo6zfp`, with `Manrope` + `Geist_Mono` (Google) as fallbacks. **This violates the one-family rule and is the largest open migration.**

**Done (Phase 1 spike):** collapsed to a **single family — Polymath** (Typekit kit `weg5tjh`, the Mission Polymath kit) behind a swap seam in `frontend/src/app/globals.css`, so the family name lives in exactly one place:

```css
--brand-typeface-display: "polymath"; /* headings */
--brand-typeface-text:    "polymath"; /* body, UI, data */
```

`--font-display`/`--font-sans`/`--font-mono` (in the `@theme inline` block) now all resolve through these seam vars; `body` and `h1–h6` reference them too. Fractul, CoFo Sans and CoFo Sans Mono are dropped; `Manrope` + `Geist_Mono` (Google) remain only as fallbacks while Polymath loads. **To swap to Euclid when licensed:** self-host the woff2 (`@font-face`, `font-display: swap`), set both seam vars to `"euclid-circular-b"`, and drop the Typekit `<link>` in `layout.tsx` — a no-op everywhere else. The heading↔body distinction is then created through **weight, size, colour and optical letter-spacing** (§3.3) — *not* separate font cuts. **Hierarchy is size + colour at weight 500; never bold.**

**Mono folds into the text face** with tabular figures (`font-feature-settings: "tnum"`) so numeric columns in costing/ingredient/cost tables align without a true monospace — retiring `cofo-sans-mono-variable`.

### 3.2 Weight band

A deliberately narrow band — weight does the work ALL-CAPS would do elsewhere:

| Weight | Name | Where |
|---|---|---|
| 300 | Light | **All body copy**, ledes, captions, large display quotes. |
| 400 | Regular | Nav items, small UI labels, table cell text, inline. |
| 500 | Medium | **All headings**, eyebrows, buttons, names, metric/cost values, tags, table headers. The workhorse for emphasis. |
| 600 | Semibold | Rare — reserved for the few cases 500 doesn't separate. |
| 700 | Bold | Avoid. |

Rule of thumb: **headings 500, body 300, almost nothing between.** Phase 2 sweeps the 144 current `font-bold`/`font-semibold` usages down to this band.

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
| `h1` | `-0.018em` |
| `h2` | `-0.014em` |
| `h3` | `-0.01em` |
| `h4`–`h6` | `-0.006em` |
| body | `0` (normal) |

### 3.4 Text color

- **Headings:** `--foreground` (warm ink) on light; `#ffffff` on dark.
- **Eyebrows / section labels:** `--primary` (forest) on light; `rgba(255,255,255,0.72)` on dark. *Always the brand — the single most identifying cue.*
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

App surfaces use the existing shell gutters (`p-4 md:p-6 lg:p-8`). Marketing/standalone-page gutters (`--pad-x: 56px`, `--content-max: 1320px`) apply only if RecipeRep grows public/marketing pages.

### 4.2 Vertical rhythm — two registers

- **Empty / onboarding:** generous — big content wants big gaps (44–110px); mobile compresses to ~80–100px.
- **Operational / data (the default in RecipeRep):** disciplined. Page padding `p-4 md:p-6 lg:p-8`; card padding `p-6`; section gaps `mb-6`/`mb-8`; tight table rows. Air comes from hairlines and whitespace *within* a dense grid, not big voids.

### 4.3 Corner radii

| Radius | Used on |
|---|---|
| `999px` | Pills, buttons, tags, chips, status badges, dots, avatars. |
| `16px` | Dropdown/nav panels, dialogs, sheets. |
| `10–12px` | Icon chips, small inline buttons, dropdown item hover. |

App cards use `rounded-lg` (~8px). **Retune `--radius` from the current `0.75rem` (12px) to `0.5rem` (8px)**; the `--radius-sm/md/lg/xl` scale follows. Pills override to fully-round.

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

The one optional "effect," used with restraint over a dark accent canvas only. **Never on flat light/beige surfaces** (nothing to blur — use a solid card + hairline instead). In RecipeRep, glass is essentially unused — operational data surfaces sit on white/beige and use solid cards. Reserve for any future dark hero/empty surface; blur 14–18px, ~14% white fill, 0.5px translucent border, white text. No colored glass, no thick borders, no stacked layers.

---

## 7. Icons

Stroke-based, single-color, one drawing language. RecipeRep uses **`lucide-react`** (thin-line, Mission-compatible). Keep `fill="none"`, thin strokes, `round` linejoin/linecap. On light: ink stroke. On dark: `#ffffff`. Forest green is for icon **chips** (the rounded tile behind an icon), not the glyph itself. **Avoid filled/duotone/multicolor variants. No emoji as UI icons** (note: the menu-sketch dish icon-tags use emoji as *content/data*, which is fine — that's not chrome).

---

## 8. Motion

**Quiet, slow-ish, self-completing** — the page settling, never demanding attention.

- **Easing vocabulary:** `cubic-bezier(0.16,1,0.3,1)` entrances · plain `0.2s ease` small UI hovers.
- **Durations:** UI hovers `0.15–0.2s`; entrances `0.7–0.9s`; dropdowns `0.18s`.
- **Reduced motion is mandatory and already shipped** (0.0.49): the `@media (prefers-reduced-motion: reduce)` block in `globals.css` neutralises transitions, animations, and smooth scroll. Any new motion must respect it.

**Remove the legacy lift/scale utilities.** `.flow-ui-hover-lift` (translate + shadow on hover) and `.flow-ui-active-scale` (scale-on-press) — plus the `game-card-hover` lift and `mono-gradient` decoration — embody the lift/scale/shadow/gradient style Mission rejects. Phase 3/4 removes them (6 `flow-ui-*` + 34 `game-card` + 2 `mono-gradient` usages to migrate first).

---

## 9. Shadows

Nearly invisible; exactly one job — lifting a floating panel/dropdown off the canvas. Soft, long, very low-opacity, ink-tinted (never black): dropdown `0 24px 60px rgba(23,23,23,0.08)`. **No shadow on buttons, sections, or static cards** — those use a 0.5px hairline. When in doubt, reach for a hairline, not a shadow. (Phase 0 found 48 `shadow-*` usages to triage — most should become hairlines.)

---

## 10. File structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css   # tokens (color, status, dark), base styles, reduced-motion
│   │   └── layout.tsx    # Typekit link (three faces → one), TopNav, Providers
│   ├── components/
│   │   ├── ui/           # primitives (Button→pill, Card, Badge, Modal, Input…)
│   │   ├── layout/       # TopNav, TopAppBar, CanvasLayout, LeftPanel, RightPanel, tabs/
│   │   └── ...
│   └── lib/
│       ├── api.ts        # typed fetch wrapper
│       └── hooks/        # TanStack Query hooks
```

`docs/references/design.md` (this file) is RecipeRep's portable contract. The Mission master lives in the Mission Systems repo; keep RecipeRep-specific adaptations (two-tier color, compact UI scale, top-nav shell, dark mode, `--primary`-as-brand naming) in sync conceptually, not by copy-paste.

---

## 11. Best practices

1. **Use tokens, never hardcoded colors** (`text-muted-foreground` / `bg-card`, not `text-gray-500` / `bg-white`). Phase 0 audits and fixes the ~3,100 violations.
2. **Brand green is chrome; status hues are data.** Never style a button or link with a status color, never a badge with the brand accent.
3. **Sentence case, always.** No ALL-CAPS, including table headers and tags (31 to fix).
4. **Hairline before border, nothing before shadow.**
5. **Body is 300, headings are 500.** Reach for weight, not size or caps, to create emphasis (144 bold/semibold to band down).
6. **Pick the right scale** — display for empty/onboarding, compact UI for the canvas and data.
7. **Status must stay legible** — desaturated, but never so quiet a chef can't scan recipe/ingredient/cost state.
