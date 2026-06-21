# Blueprint — UI/UX Audit & Redesign Notes

_Date: 2026-06-21_

A critique of the whole system's UI/UX, with the high-impact items fixed in this
pass marked **✅ Fixed** and the rest captured as prioritized recommendations.
The design foundation (tokens, typography scale, glass panels, semantic colors in
`styles/globals.css`) is genuinely strong — most issues are about **consistency
and applying that foundation evenly**, not rebuilding it.

---

## What's working

- **Mature design-token system.** `globals.css` defines a coherent palette,
  spacing/radius/shadow scales, a typography scale (`heading-xl` … `text-caption`),
  and semantic colors. This is a solid base.
- **Theming + accessibility primitives** already exist: high-contrast mode,
  reduced-motion handling, skip-to-content, `sr-only`, focus-ring utilities.
- **Reusable shells**: `Layout`, `Card`, `Button`, `Sidebar`, skeletons, toasts,
  confirm dialogs. The component vocabulary is right.

---

## Issues found

### 1. Broken glyph in the theme picker — ✅ Fixed
`settings.tsx` rendered a literal `?` where a checkmark belonged on the selected
theme swatch (a lost glyph). Replaced with `Icons.Check` + an `aria-label`.

### 2. Stat/KPI presentation was ad-hoc — ✅ Partially fixed
Each page hand-rolled its own "big number + label" markup (see the Tasks
"Productivity Pulse" and "Weekly Summary" cards). Introduced a reusable
**`MetricCard`** primitive (`components/MetricCard.tsx`) with consistent label
casing, tabular numerals, and tone colors. The new Analytics page uses it; the
Tasks and Dashboard stat blocks should migrate to it next.

### 3. No dedicated analytics/reporting surface — ✅ Fixed
Analytics were a single "Productivity Pulse" card buried on the Tasks page, with
no habit reporting and no concern flagging. Added a first-class **`/analytics`**
page (weekly/monthly reports: completion average, on-time rate, habit adherence,
and flagged areas of concern) plus a deterministic engine (`lib/analyticsEngine.ts`).

### 4. Heading inconsistency — ⚠️ Recommended
Some pages use the `.heading-xl` utility (Tasks, Analytics); others inline
`text-2xl font-display font-bold` (Settings). Pick `.heading-xl` everywhere for
page titles so size/tracking/weight stay consistent. Low effort, high payoff.

### 5. Empty states are uneven — ⚠️ Recommended
Some lists show a thoughtful empty state; others render a bare "No data" string.
Standardize on the existing `EmptyState` component (icon + title + hint + optional
CTA). The new Analytics page models the target pattern.

### 6. Color-only status signals — ⚠️ Recommended (accessibility)
Priority/status badges lean on color alone (e.g. red/amber/teal). For
color-blind users, pair color with a glyph or text label. Badges already support
an icon slot — use it for high-priority/overdue/at-risk states. High-contrast
mode helps but isn't a substitute.

### 7. Focus-visible states are inconsistent — ⚠️ Recommended (accessibility)
Buttons defined via `.btn-*` have `:focus-visible` rings, but many inline
`<button style={...}>` elements (filters, theme swatches, chips) don't. Route
them through the `Button` component or add `.focus-ring`. Keyboard users
currently lose the focus indicator on several controls.

### 8. Information density / scan-ability — ⚠️ Recommended
The Tasks page stacks six full-width cards (Start Lane, Quick Add, Filters,
Weekly Summary, Productivity Pulse, Intelligence) before the task list — a lot of
scrolling before the primary content. Consider collapsing secondary cards behind
a "Focus mode" or moving analytics to the new `/analytics` route (done) and
tightening the Tasks page to capture + list.

### 9. Mobile spacing rhythm — ⚠️ Recommended
Page containers vary (`max-w-3xl`, `max-w-7xl`, none) and vertical rhythm
(`space-y-4` vs `space-y-6`) differs per page. Define one page-shell wrapper
(container + padding + vertical rhythm) and apply it via `Layout` so every screen
breathes the same way.

### 10. Discoverability of analytics — ✅ Fixed
Added `/analytics` to the sidebar (Productivity group) and the global search, and
a cross-link from the Tasks page so the deeper report is one tap away.

---

## Prioritized backlog

| Priority | Item | Status |
|---------|------|--------|
| P1 | Migrate Tasks/Dashboard stat blocks to `MetricCard` | ✅ Done — Tasks (Weekly Summary, Productivity Pulse) + Dashboard "Today at a glance" |
| P1 | Add glyphs to color-coded badges | ✅ Done — `PriorityBadge`/`TaskStatusBadge` pair color with icon + label |
| P2 | Standardize page titles on `.heading-xl` | ✅ Done — settings, goals, finance, notes migrated (auth/demo screens intentionally separate) |
| P2 | Single page-shell wrapper | ✅ Done — `PageContainer` adopted on dashboard, tasks, analytics, settings, goals, finance |
| P2 | Keyboard focus indicator on all controls | ✅ Done — global `:focus-visible` baseline ring in `globals.css` (custom `.btn-*` rings preserved) |
| P3 | Standardize empty states on `EmptyState` | ✅ Done — dashboard (quick tasks, body metrics) + Tasks list empty/no-match states |
| P3 | Tighten Tasks page density / Focus mode | ⚠️ Recommended (deferred — larger UX change) |
| — | Adopt `PageContainer` on remaining pages | ⚠️ Incremental — pattern established, migrate the rest opportunistically |

---

## Changes shipped

**Features & auth**
- ✅ Removed 2FA; auth is now plain email/password (`login.tsx`, `settings.tsx`, deleted `useMfa`).
- ✅ New `/analytics` weekly/monthly report page + engine + unit tests.

**Design-system / consistency**
- ✅ Reusable `MetricCard` primitive; adopted on Tasks + Dashboard.
- ✅ Reusable `PriorityBadge` / `TaskStatusBadge` (glyph + label, not color-only).
- ✅ Fixed the broken theme-picker glyph.
- ✅ Page titles standardized on `.heading-xl` across main app pages.
- ✅ Sidebar + search + Tasks cross-link to Analytics.
- ✅ `PageContainer` page-shell for consistent width + vertical rhythm.
- ✅ Global keyboard `:focus-visible` ring for all interactive controls.
- ✅ `EmptyState` adopted for dashboard + Tasks empty states.
