# Blueprint UX & Design System Guide

Blueprint is a personal devotional + productivity companion for two people. The
visual language is **calm, focused, encouraging, lightly technical** — dark glass
panels, a single configurable accent, generous spacing, and restrained motion.

Everything is driven by **design tokens** (CSS custom properties) defined in
[`styles/globals.css`](styles/globals.css) and applied at runtime per theme by
[`components/ThemeProvider.tsx`](components/ThemeProvider.tsx) from the theme
configs in [`lib/store.ts`](lib/store.ts). **Never hard-code colors, radii, or
shadows in components — reference the tokens** so all four themes and the
high-contrast mode stay coherent.

## Themes

Four themes, each a set of `--theme-*` values in `lib/store.ts`: **dark** (cyan),
**electric** (blue), **midnight** (violet), **pink** (the couple's default). The
runtime source of truth is `lib/store.ts`; the `:root` values in `globals.css` are
fallbacks. A `[data-contrast='high']` override boosts borders/text for
accessibility. All muted-text values meet WCAG AA (≥4.5:1).

## Tokens (use these, not literals)

| Group | Tokens |
|---|---|
| Color | `--theme-bg`, `--theme-surface`, `--theme-surface-hover`, `--theme-border`, `--theme-text`, `--theme-text-dim`, `--theme-text-muted`, `--theme-accent`, `--theme-accent-hover`, `--theme-accent-text`, `--theme-card-bg`, `--theme-input-bg` |
| Semantic | `--color-success|error|warning|info` (+ `-dim`, `-surface`, `-border`) |
| Type | `--text-2xs … --text-3xl`, `--leading-tight|normal|relaxed`, `--font-weight-medium|semibold|bold` |
| Space | `--space-xs … --space-2xl` |
| Radius | `--radius-sm … --radius-2xl`, `--radius-full` |
| Elevation | `--shadow-sm … --shadow-xl` |
| Motion | `--transition-fast|base|slow`, `--ease-soft` |

For accent tints, prefer `color-mix(in srgb, var(--theme-accent) N%, transparent)`
rather than a new hard-coded rgba — it tracks the active theme automatically.

## Typography

Fonts: **Inter** (body), **Space Grotesk** (display/headings). Use the utility
classes, not ad-hoc sizes:
`.heading-xl` (page title) · `.heading-lg` · `.heading-md` · `.heading-sm` ·
`.heading-xs` (eyebrow) · `.text-body` · `.text-caption` · `.text-label` ·
`.text-mono`.

## Components & primitives

- **Surfaces:** `.panel-glass` (primary card), `.panel-glass-subtle`,
  `.modal-panel`. The [`Card`](components/Card.tsx) component wraps these with a
  title/subtitle slot — prefer it over raw divs.
- **Buttons:** `.btn-accent` (primary), `.btn-secondary`, `.btn-outline`,
  `.btn-ghost`, `.btn-danger`, `.btn-glow` (pill). Sizes `.btn-sm` / `.btn-lg`.
  All have tactile `:active` press, consistent disabled state, and accent focus
  rings. Use the [`Button`](components/Button.tsx) component which maps to these.
- **Inputs:** `.input-base` (accent focus ring, themed placeholder).
- **Badges:** `.badge`, `.badge-accent|success|error|warning|info`.
- **Feedback:** `.card-skeleton` (loading), toasts via `useToastStore`,
  `ConfirmDialog` for destructive actions, `EmptyState` for zero-data.

## Motion

Subtle and purposeful: micro-fades/slides on content change (framer-motion,
~0.2–0.25s), `.hover-lift` on cards, `:active` scale on buttons. **All of it is
disabled under `prefers-reduced-motion`** (see the media query in globals.css) —
keep new animations inside that contract.

## Accessibility (baseline, always)

- Color contrast AA; muted text already tuned per theme.
- Visible keyboard focus rings on every interactive element (global
  `:focus-visible` rule + `.focus-ring`).
- `.skip-to-content` link, `.sr-only` for screen-reader text, ARIA labels on
  icon-only controls and the interactive SVGs (muscle map, body map).
- High-contrast mode via `[data-contrast='high']`.

## Patterns / conventions

- **Page shell:** `Layout` + `PageContainer`; header uses `.heading-xl` + a muted
  subtitle line.
- **Section dividers:** `.section-header` (title with trailing rule).
- **Encouraging tone:** copy across devotional/wellness features is warm and
  second-person ("you are held too"), never clinical.
- **Illustrations:** SVG, theme-aware (fills from `--theme-*`), with legends and
  hover/tap detail. See [`MuscleMap`](components/MuscleMap.tsx) and
  [`BodyMapSelector`](components/BodyMapSelector.tsx).

## When adding UI

1. Reach for an existing class/component first.
2. If you need a value, use a token; if no token fits, add one to `:root` rather
   than inlining a literal.
3. Verify in at least the **pink** and **dark** themes + mobile width.
4. Keep motion inside the reduced-motion contract.
