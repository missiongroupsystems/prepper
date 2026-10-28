# Mission Recipes Design System

This document outlines the design system for Mission Recipes, a kitchen-first recipe workspace for chefs and operators.

> **Canonical tokens live in [`design.md`](design.md)** (§2 colour, §3 type, §4.3 radii, §8–9 motion and shadows), updated for the 0.1.2 foundations pass. The colour and typography sections below predate it; the Dark Mode, Branding and File Structure sections are current.

## Overview

The Mission Recipes design system is built on:
- **Tailwind CSS 4** with CSS custom properties
- **shadcn/ui-style** components (customized)
- **Three-font typography** via Adobe Typekit
- **Warm, kitchen-inspired** color palette with terracotta primary

---

## Typography

### Font Stack

| Token | Font | Fallback | Usage |
|-------|------|----------|-------|
| `--font-sans` | CoFo Sans Variable | Manrope, system-ui | Body text, UI elements |
| `--font-mono` | CoFo Sans Mono Variable | Geist Mono, ui-monospace | Code, data tables, measurements |
| `--font-display` | Fractul Variable | Manrope, system-ui | Headings (h1-h6) |

### Loading

Fonts are loaded via Adobe Typekit in `layout.tsx`:

```html
<link rel="stylesheet" href="https://use.typekit.net/syo6zfp.css" />
```

### Application

```css
body {
  font-family: "cofo-sans-variable", var(--font-manrope), system-ui, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "fractul-variable", var(--font-manrope), system-ui, sans-serif;
}
```

---

## Color System

### Core Brand Colors

These foundational colors are referenced by semantic tokens:

| Name | Light Mode HSL | Purpose |
|------|----------------|---------|
| `--color-terracotta` | 15 65% 50% | Primary actions, warm kitchen feel |
| `--color-green` | 140 50% 35% | Success, approved, fresh ingredients |
| `--color-teal` | 160 50% 40% | Info, testing, in-progress |
| `--color-amber` | 35 80% 50% | Warning, attention needed |
| `--color-red` | 0 70% 47% | Error, archived, out of stock |
| `--color-slate` | 220 10% 50% | Neutral, draft |
| `--color-sage` | 120 25% 45% | Tertiary, herbs/freshness accent |

Each core color has `-light` and `-dark` variants for backgrounds and emphasis.

### Semantic Tokens

| Token | Light Mode | Usage |
|-------|------------|-------|
| `--background` | 40 30% 97% | Page background (warm cream) |
| `--foreground` | 220 20% 13% | Primary text |
| `--primary` | var(--color-terracotta) | Primary buttons, links |
| `--secondary` | 35 20% 94% | Secondary surfaces |
| `--muted` | 35 15% 94% | Disabled backgrounds |
| `--muted-foreground` | 0 0% 55% | Secondary text, inactive nav |
| `--accent` | 35 20% 92% | Hover highlights |
| `--tertiary` | var(--color-sage) | Herbs, freshness accents |
| `--destructive` | var(--color-red) | Delete, error actions |
| `--card` | 40 25% 96% | Card backgrounds |
| `--border` | 35 15% 85% | Borders, dividers |

### Recipe Lifecycle Status Colors

Used by the Badge component and status utility classes:

| Status | Text Token | Background Token | Usage |
|--------|------------|------------------|-------|
| Draft | `--status-draft` | `--status-draft-bg` | New/unpublished recipes |
| Testing | `--status-testing` | `--status-testing-bg` | Recipes being tested |
| Approved | `--status-approved` | `--status-approved-bg` | Production-ready recipes |
| Archived | `--status-archived` | `--status-archived-bg` | Retired recipes |

### Ingredient Status Colors

| Status | Text Token | Background Token | Usage |
|--------|------------|------------------|-------|
| Active | `--status-active` | `--status-active-bg` | Available ingredients |
| Inactive | `--status-inactive` | `--status-inactive-bg` | Discontinued ingredients |

### Inventory Status Colors

| Status | Text Token | Background Token | Usage |
|--------|------------|------------------|-------|
| Optimal | `--status-optimal` | `--status-optimal-bg` | Stock levels good |
| Low | `--status-low` | `--status-low-bg` | Reorder needed |
| Excess | `--status-excess` | `--status-excess-bg` | Overstocked |

---

## Components

### Card

Clean, minimalist design:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Recipe Name</CardTitle>
  </CardHeader>
  <CardContent>Ingredients and instructions</CardContent>
  <CardFooter>Cost: $12.50</CardFooter>
</Card>
```

Styling: `rounded-lg bg-card text-card-foreground border-border`

### Button

Four variants with four sizes:

```tsx
<Button variant="default">Primary Action</Button>
<Button variant="outline">Secondary Action</Button>
<Button variant="ghost">Subtle Action</Button>
<Button variant="destructive">Delete</Button>
```

Sizes: `default`, `sm`, `lg`, `icon`

### Badge

Status indicators for recipes and ingredients:

```tsx
<Badge variant="default">Default</Badge>
<Badge variant="success">Approved</Badge>
<Badge variant="warning">Testing</Badge>
<Badge variant="destructive">Archived</Badge>
```

### Status Labels

Utility classes for quick status display:

```html
<span class="status-draft">Draft</span>
<span class="status-testing">Testing</span>
<span class="status-approved">Approved</span>
<span class="status-archived">Archived</span>
```

---

## Layout

### App Structure

```
┌─────────────────────────────────────────┐
│  TopNav (h-16, border-b)                │
├─────────────────────────────────────────┤
│                                         │
│  Main Content                           │
│  (flex-1, overflow-hidden)              │
│                                         │
└─────────────────────────────────────────┘
```

### Spacing Scale

Standard Tailwind spacing with these common patterns:
- Page padding: `p-4 md:p-6 lg:p-8`
- Card padding: `p-4` or `p-6`
- Section gaps: `gap-4`, `gap-6`
- Component margins: `mb-4`, `mb-6`, `mb-8`

---

## Utility Classes

### Animation

```css
.flow-ui-hover-lift    /* Subtle lift on hover */
.flow-ui-active-scale  /* Scale down on click */
```

### Gradients

```css
.mono-gradient       /* Warm neutral gradient background */
.mono-gradient-text  /* Gradient text effect */
```

---

## Dark Mode

Shipped again in 0.1.2, matching Mission Workforce. Choices: **System · Light · Dark**; nothing stored means Light. The full token map and plumbing are in [`design.md` §2.6](design.md#26-dark-mode-shipped).

### Usage

```tsx
import { ThemeToggle, useTheme } from '@/components/theme';

// Ready-made control (radio group):
<ThemeToggle />

// Or read / set the choice yourself:
const { choice, resolvedTheme, setChoice } = useTheme();
setChoice('dark'); // 'system' | 'light' | 'dark'
```

Style with tokens (`bg-card`, `text-muted-foreground`, `border-border`) and dark mode follows for free. Reach for the `dark:` variant only when a token can't express the difference.

---

## Branding

### Logo

The Mission Recipes lockups (Mission Systems suite) are single-colour SVGs in `public/logo/`:

| File | Lockup |
|------|--------|
| `MS-Recipes-blk-inlinelong.svg` | Mark + "Mission Recipes", one line (primary) |
| `MS-Recipes-blk-inlineshort.svg` | Mark + "Recipes", one line |
| `MS-Recipes-blk-sidestack.svg` | Mark beside a stacked wordmark |
| `MS-Recipes-blk-stackleft.svg` | Mark over a left-aligned stacked wordmark |
| `MS-Recipes-blk-stackcentre.svg` | Mark over a centred stacked wordmark |
| `MS-Recipes-blk-icon.svg` | The mark alone |
| `MS-Recipes-blk-favicon.svg` | The mark reversed out of a forest rounded square |
| `MS-Recipes-blk-inlinelong.png` | 840px PNG of the inline lockup, for email clients |

The files carry a fixed forest fill. **In the UI, use `BrandLogo`**: it inlines the paths with `fill="currentColor"`, so `text-accent` paints it and it lifts to the lighter green in dark mode.

```tsx
import { BrandLogo } from '@/components/brand';

<BrandLogo className="h-6 w-auto text-accent" />                 // full (default)
<BrandLogo variant="short" className="h-6 w-auto text-accent" /> // mark + "Recipes"
<BrandLogo variant="mark" className="size-6 text-accent" />      // mark only
```

TopNav uses the full variant. The tasting invitation email (`app/api/send-tasting-invitation/route.ts`) uses the PNG, because email clients don't render SVG reliably.

### Favicon & Icons

All come from Next's file conventions; `layout.tsx` sets no `icons` metadata.

| File | Purpose |
|------|---------|
| `src/app/icon.svg` | SVG favicon (the `favicon` lockup) |
| `src/app/apple-icon.png` | 180×180 Apple touch icon, full-bleed forest |
| `src/app/manifest.ts` | Web app manifest, "Mission Recipes" |
| `public/icons/icon-192.png`, `icon-512.png` | PWA icons |
| `public/icons/icon-maskable-512.png` | Maskable PWA icon, mark inside the 80% safe zone |

The PNGs are rendered from the SVGs with `rsvg-convert`.

---

## File Structure

```
frontend/
├── public/
│   ├── fonts/satoshi/            # Satoshi variable (regular + italic)
│   ├── logo/                     # MS-Recipes-blk-* lockups + email PNG
│   └── icons/                    # PWA icons
├── src/
│   ├── styles/tokens.css         # raw tokens, light + dark
│   ├── app/
│   │   ├── globals.css           # @theme map, base styles, utilities
│   │   ├── layout.tsx            # no-flash theme script, metadata, providers
│   │   ├── icon.svg · apple-icon.png · manifest.ts
│   │   └── design-system/        # showcase (rendered in Settings → Design)
│   ├── components/
│   │   ├── brand/BrandLogo.tsx
│   │   ├── theme/                # ThemeProvider, useTheme, ThemeToggle
│   │   ├── layout/TopNav.tsx
│   │   └── ui/                   # Button, Card, Badge, Input, Select, Textarea, …
│   └── lib/
│       ├── theme.ts              # theme rule + THEME_BOOT_SCRIPT
│       ├── utils.ts              # cn() helper
│       └── providers.tsx         # app providers
└── docs/references/design-system.md
```

---

## Best Practices

1. **Use tokens, not hardcoded colors**
   ```tsx
   // Good
   className="text-muted-foreground bg-card"

   // Avoid
   className="text-gray-500 bg-white"
   ```

2. **Reference core colors for custom status**
   ```css
   --my-status: var(--color-teal);
   --my-status-bg: var(--color-teal-light);
   ```

3. **Maintain typography hierarchy**
   - Headings: Fractul (display)
   - Body/UI: CoFo Sans
   - Data/Code/Measurements: CoFo Sans Mono

4. **Use semantic color tokens**
   ```tsx
   // Good - semantic meaning
   className="bg-primary text-primary-foreground"

   // Avoid - specific color
   className="bg-orange-500 text-white"
   ```

5. **Leverage status classes**
   ```tsx
   // Good - uses design system
   <span className="status-approved">Approved</span>

   // Also good - Badge component
   <Badge variant="success">Approved</Badge>
   ```

6. **Support dark mode**
   - Use CSS variables, not hardcoded colors
   - Test both light and dark modes
   - Use `resolvedTheme` from `useTheme()` for conditional rendering

---

## Migration from Previous System

### Key Changes

| Previous | New |
|----------|-----|
| Geist Sans | CoFo Sans Variable |
| Geist Mono | CoFo Sans Mono Variable |
| No display font | Fractul Variable (headings) |
| Zinc palette | Terracotta/warm palette |
| `prefers-color-scheme` only | Manual + system theme support |
| Hardcoded Tailwind classes | CSS custom properties |

### Component Updates Required

All UI components should be updated to use new semantic tokens:
- Replace `bg-zinc-*` with `bg-card`, `bg-secondary`, etc.
- Replace `border-zinc-*` with `border-border`
- Replace `text-zinc-*` with `text-foreground`, `text-muted-foreground`
- Update focus rings to use `ring-ring`
