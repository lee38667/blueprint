# Blueprint — End-to-End Redesign & Dual Theme System

> Personal life-tracking companion. Capture daily moments, habits, moods, notes, photos,
> goals and reflections with near-zero friction — then look back on a beautiful timeline.
> Built on the existing stack: **Next.js 16 (Pages Router) · React 19 · Tailwind v4 ·
> Zustand · Supabase (RLS)**. This redesign is **additive** — it extends the live
> `--theme-*` token contract and `ThemeName` union rather than replacing them.

**Companion files:** [`prototype.html`](prototype.html) (interactive, 4 live theme variants) ·
this document (strategy, IA, flows, design system, a11y, handoff, roadmap).

---

## 1. Executive Summary

Blueprint already ships the hard parts — auth, RLS, AI coaches, fitness/devotional/integration
subsystems, and a mature glassmorphic design system. The gap is **experience cohesion**: 22 feature
pages without a single calm spine, no fast-capture primitive, and a timeline that exists as data but
not as a *memory you want to revisit*. This redesign delivers three things:

1. **A friction-free capture model** — one omnipresent input + smart chips that turns any thought,
   mood, photo or habit-tick into a logged moment in **under 10 seconds**, from anywhere in the app.
2. **A timeline-first information architecture** — the life log becomes the emotional center of
   gravity; everything else (habits, goals, insights) feeds and reflects it.
3. **Two fully-expressed identities** sharing one accessible skeleton:
   - **Aozora** — anime-inspired, masculine, HUD-confident, dark-primary (+ day mode).
   - **Grace & Bloom** — soft-pink, faith-centered, serene, light-primary (+ evening mode).

Both themes are token-only swaps: same components, same a11y guarantees, radically different soul.

**North-star metric:** median time-to-log < 10s · 5+ moments captured/day · weekly reflection opened.

---

## 2. Personas

| | **Kai** — "the disciplined one" | **Esther** — "the grateful one" |
|---|---|---|
| **Age / context** | 28, software + gym, commutes, evenings free | 24, student/young-pro, journals nightly |
| **Drives** | Mastery, streaks, measurable progress, looking back on "how far I've come" | Peace, gratitude, faith, gentle accountability, remembering God's goodness |
| **Frustrations** | Apps that nag, clutter, or feel "soft"; losing a streak feels punishing | Apps that feel cold, clinical, or guilt-trip; pressure to perform |
| **Theme** | Aozora (dark) | Grace & Bloom (light) |
| **Signature need** | "Log it in 3 taps and show me the trend." | "A calm space to reflect and a verse to hold onto." |
| **Microcopy that lands** | "Streak secured." "Today's mission." | "Be still." "Grace for today." |

Design implication: **streaks must never shame** (Esther) and **calm must never feel passive**
(Kai). The streak component reads "24-day streak — keep it gentle," and a missed day shows a
*grace day* token, not a broken flame.

---

## 3. Information Architecture

Blueprint is a **personal life OS**, not just a journal — the IA must hold every existing subsystem
(finance, fitness, AI coach, mental, skills, devotional, tasks, content, motivation…) under one calm
spine. The capture + timeline model is the *connective tissue* across all of them: a gym PR, a spend,
a prayer and a mood all become moments on the same timeline.

```
Blueprint
├── TODAY
│   ├── Dashboard          ← capture + today's log + mood + habits + ring + life-area glances
│   └── Timeline           ← THE life log: every subsystem's events, day/week/month/year lenses,
│                             "On This Day", filter by area/tag/type
├── PLAN
│   ├── Tasks              ← to-dos, AI task breakdown
│   ├── Habits             ← grid + streaks (grace-day) + gentle reminders
│   ├── Goals              ← intentions, milestones, AI date-aware planner
│   └── Calendar           ← month grid overlaying moments + habits + tasks + moods
├── LIFE AREAS            ← the "Life Areas" hub; each is a domain dashboard that feeds the timeline
│   ├── Fitness           ← workouts, muscle recovery heat-map, body quests, Google Fit/Watch
│   ├── Finance           ← budgets, spend, giving, AI finance coach
│   ├── Mind & Mood       ← mood tracking + mental-health check-ins & AI support
│   ├── Skills            ← skill trees / progress, learning logs
│   └── Journal & Notes   ← long-form entries, prompts, AI note/doc summaries
├── GROW
│   ├── Devotional        ← topic-based daily scripture (existing /api/scripture/daily)
│   ├── Motivation        ← quotes, vision board, Unsplash imagery, Spotify focus
│   └── Insights          ← weekly/monthly patterns, trends, opt-in AI summary across ALL areas
├── ASSIST
│   ├── AI Coach          ← unified chat/copilot over your data (goal/finance/mental/body/notes)
│   ├── Content           ← saved articles / media feed
│   └── Notifications     ← reminder center, Web Push
└── YOU (Settings)
    ├── Profile
    ├── Themes & customization  ← Aozora / Grace switch + accent + density
    ├── Reminders & streaks
    ├── Privacy & data          ← export, lock, delete, local-only toggle
    └── Integrations            ← Google Fit, Spotify, Unsplash, Wger, Web Push
```
> **Coverage note:** the v1 IA wrongly narrowed Blueprint to journaling. The nav above maps 1:1 to
> the real pages (`pages/{gym,finance,mental,skills,life-areas,chat,tasks,content,motivation,
> scripture,notifications,…}.tsx`). The prototype sidebar now renders all 17 destinations in these
> 5 groups, and the dashboard shows live **Fitness / Finance / AI Coach** glance tiles.

**Nav model (responsive):**
- **Desktop ≥820px** — persistent left sidebar, grouped *Today / Reflect / You*. Active state by
  accent fill + inset ring.
- **Mobile <820px** — 4-item bottom tab bar (Home · Timeline · Insights · You) with a center
  **floating "+" capture FAB**. Never more than 5 targets, all icon **+ label**.
- The capture input is reachable from every screen (sticky on desktop, FAB on mobile, plus a global
  keyboard shortcut `N`).

---

## 4. Five Primary User Flows

1. **Quick capture (<10s)** — Tap input / press `N` → type "ran 5k, felt strong" → smart chips
   auto-suggest `#fitness` + mood → Enter. Toast: "Logged · 9:24 PM" with **Undo**. No modal, no
   page change. Optional: long-press FAB → voice/photo capture.
2. **Mood check-in** — One-tap 5-point face scale on dashboard → optional one-line "why" reveals on
   tap (progressive disclosure) → saved silently. Feeds Mood trend + timeline dot.
3. **Review the timeline** — Open Timeline → scroll memory → switch Day/Week/Month lens → tap any
   moment to expand (photo, tags, edit) → "On This Day" resurfaces a memory from a year ago.
4. **Habit + streak loop** — Dashboard habit row → tap circle to complete (spring tick + streak
   increments) → gentle reminder fires only if *not yet done by user's set time* → missed day =
   grace token, streak preserved once/week.
5. **Weekly reflection** — Sunday gentle nudge → Insights opens with the week's spark + an **opt-in**
   AI summary ("You logged 38 moments; calmest day was Sunday") → user can accept tags/insights or
   dismiss. One reflective journal prompt offered, never forced.

---

## 5. Wireframes (key screens)

Low-fidelity structure (high-fidelity is the interactive `prototype.html`):

**Dashboard / Today**
```
┌ sidebar ┐┌──────────────── main ───────────────────────┐
│ brand   ││ Greeting + theme switch                      │
│ Today   ││ ┌ CAPTURE: [ input……………… ] [Log] ┐           │
│ ·Dash●  ││ │  ◦Mood ◦Photo ◦Note ◦Habit ◦Voice│         │
│ ·Time   ││ └──────────────────────────────────┘         │
│ ·Journal││ ┌ Today's life log (timeline) ┐ ┌ Mood ring ┐│
│ Reflect ││ │ • 9:24 wind-down            │ │ 😌 1-tap   ││
│ ·Mood   ││ │ • 7:10 gym PR  [photo]      │ ├───────────┤│
│ ·Insite ││ │ • 1:30 lunch w/ Sam         │ │ ◯ 72% day ││
│ You     ││ └─────────────────────────────┘ └───────────┘│
│ [LR]    ││ ┌ Habits ┐ ┌ This week spark ┐ ┌ Verse/Resolve┐
└─────────┘└──────────────────────────────────────────────┘
```

**Timeline (full)** — centered single column, sticky day headers, left rail with gradient spine,
lens switcher pinned top-right, "On This Day" card injected contextually.

**Mobile** — single column, capture collapses to FAB, bottom tab bar, cards stack full-width,
44px+ targets, safe-area padding on the bottom bar.

Breakpoints: **375 / 768 / 1024 / 1440**. Verified in prototype at mobile (FAB + bottom nav appear),
tablet (2-col), desktop (sidebar + 3-col).

---

## 6. Design System (shared skeleton)

One component set, themed entirely through CSS variables. Tokens map 1:1 to the app's existing
`ThemeConfig` (`lib/store.ts`) and `--theme-*` custom properties (`styles/globals.css`).

### 6.1 Token contract (per theme)
| Token | Role |
|---|---|
| `--theme-bg` / `--theme-bg-2` | page gradient stops |
| `--theme-surface` / `-hover` | chips, ghost buttons, secondary fills |
| `--theme-card` | glass panel fill |
| `--theme-input` | field background |
| `--theme-border` / `-strong` | hairlines / emphasized edges |
| `--theme-text` / `-dim` / `-muted` | 3-step text hierarchy (all AA verified) |
| `--theme-accent` / `-hover` / `--theme-on-accent` | primary action |
| `--theme-accent-2` | secondary highlight (sakura / lavender) |
| `--theme-streak` | streak gold |
| `--grad-hero` | signature gradient (logo, verse card, charts) |
| `--shadow` / `--glow` | elevation + focus glow |
| `--radius` / `--radius-lg` | corner language (anime tighter, grace softer) |
| `--font-display` / `-body` / `-accent` | type roles |

### 6.2 Core components
Buttons (`primary` / `ghost` / `lg`, press-scale 0.97, focus glow) · Glass **Card** · **Quick-capture**
bar + smart **chips** · **Mood** 5-point scale · **Habit** row with spring tick + streak · **Timeline**
item (dot, time, body, tags, photo) · **Insight** stat + spark · **Progress ring** · **Verse/Resolve**
gradient card · Sidebar / bottom-nav / FAB · Theme **switcher**. All in `prototype.html`.

### 6.3 v2 visual-identity upgrades (what makes it *not* generic)
The refined prototype layers six deliberate moves on top of the base system:
- **Ambient transparent art** — a themed SVG "scene" fixed behind the whole canvas at low opacity
  with a bottom gradient mask, so it never fights legibility. Aozora = rising-sun rings + layered
  mountain ranges + speed-line slashes; Grace = soft halo + light rays + drifting petals. Token-keyed
  (`--art` opacity per theme); swap the SVG for a user's own Unsplash hero via the existing integration.
- **Featured-memory card with a faded background image** — "On this day" surfaces a past moment over a
  low-opacity image + a `--card-solid` scrim gradient, demonstrating the transparent-image pattern for
  real photos.
- **Bento grid** — 12-col asymmetric layout (timeline 7-wide & 2 rows tall; feature/mood/habits/insights
  as varied tiles) for a modern, intentional rhythm instead of uniform cards.
- **Film grain** — a fixed `feTurbulence` overlay (`--grain`, overlay blend) adds analog depth.
- **Layered glass** — every card carries a 1px hairline + inset top highlight + two-stage shadow, so
  surfaces read as real material, not flat boxes.
- **Richer data viz** — 7-day mood **gradient wave** and a 2-week **activity heatmap** (both
  accent-tinted, AA-safe, reduced-motion static).
- **Sharper hierarchy** — eyebrow → display (Rajdhani/Cormorant, clamp 28–42px) → body, tabular-num
  stat blocks in the hero, accent rail on active nav.

### 6.4 Spacing, type scale, motion (inherited from globals.css)
- Spacing 4/8 rhythm: `xs .25 · sm .5 · md 1 · lg 1.5 · xl 2 · 2xl 3rem`.
- Type scale: 10·12·14·16·18·20·24·30; body line-height 1.5–1.7.
- Motion: 150–300ms, `cubic-bezier(.2,.8,.2,1)`, enter ease-out / exit faster; **all** disabled under
  `prefers-reduced-motion`.

---

## 7. The Two Theme Systems

### 7.1 Aozora — anime, masculine `[aozora-dark]` (primary) · `[aozora-light]` (day)
- **Concept:** a shonen "status HUD" for your life. Stylish, immersive, confident — clean enough to
  live in daily. Katakana micro-accents (`／ こんばんは`) appear only in this theme.
- **Palette (dark):** ink-navy `#070b16→#0c1426`, electric azure `#3da9fc`, sakura/crimson highlight
  `#ff4d6d`, gold streak `#ffb020`, text `#e8eefc`.
- **Palette (light/day):** `#eef3fb` field, deeper azure `#1f6feb` for contrast on white.
- **Type:** Rajdhani (angular HUD display, slight uppercase tracking) + Inter body + Noto Sans JP accents.
- **Background:** diagonal speed-lines motif (`repeating-linear-gradient`, overlay blend) at low opacity.
- **Components:** tighter radii (14/20px), neon focus glow, HUD-style stat numerals.
- **Microcopy:** "Today's mission." "Streak secured." "Recovery looking green." Resolve card instead
  of scripture: *"The blade dulls without the whetstone. Show up — that's the win today."*

### 7.2 Grace & Bloom — Christian, feminine `[grace-light]` (primary) · `[grace-night]` (evening)
- **Concept:** a quiet, graceful sanctuary. Soft, uplifting, faith-centered without being preachy.
- **Palette (light):** blush `#fff5f8→#fde8f1`, rose `#d6498c`, lavender accent `#a78bfa`, warm gold
  streak, plum text `#5a2240`.
- **Palette (evening/night):** deep wine `#2a1322`, soft rose `#f472b6`, lavender `#c4b5fd` — for
  nighttime prayer/journaling without harsh light.
- **Type:** Cormorant Garamond (elegant serif display; **scripture set in italic**) + Nunito Sans body.
- **Background:** scattered soft floral/petal dots, larger corner radii (18/26px), pillowy shadows.
- **Components:** rounder, softer elevation, gentle gradients.
- **Microcopy:** "Peace, Esther." "Be still, and know." "Grace for today." **Verse of the day** woven
  into the dashboard card (ties into existing `lib/scriptureThemes.ts` → `/api/scripture/daily`).

> Switching is instant and total: one `data-theme` attribute changes palette, type, radius, motif,
> *and* voice. Demonstrated live by the 4-button switcher in the prototype.

---

## 8. Accessibility Spec & WCAG 2.2 AA Checklist

The app already nails the foundations (skip link, focus rings, reduced-motion, high-contrast token
set, AA-tuned `textMuted`). This redesign holds the line:

- [x] **1.4.3 Contrast (AA)** — every text token ≥4.5:1 on its surface; large/UI glyphs ≥3:1.
      `--theme-muted` chosen per theme to clear 4.5:1 (e.g. grace `#a26a89` on `#fff5f8`).
- [x] **1.4.11 Non-text contrast** — borders/icons/focus ≥3:1 in both modes (`--theme-border-strong`).
- [x] **1.4.1 Use of color** — mood uses faces + labels; streaks use icon + number; tags use text;
      timeline types differ by dot color **and** position. Never color-only.
- [x] **2.4.7 / 2.4.11 Focus visible & not obscured** — 2px accent outline, 2px offset; sticky bars
      reserve space so focus is never hidden behind them.
- [x] **2.5.8 Target size (AA, 2.2)** — all interactive targets ≥24px, primary ≥44px; mood/habit/FAB
      sized ≥44px with ≥8px gaps.
- [x] **2.5.7 Dragging movements (2.2)** — no drag-only actions; habit complete = tap, not swipe.
- [x] **3.2.6 Consistent help (2.2)** — capture + help reachable in the same place on every screen.
- [x] **3.3.7 Redundant entry (2.2)** — smart chips pre-fill; drafts auto-save (no re-typing).
- [x] **2.3.3 / prefers-reduced-motion** — all transitions/animations neutralized; spark/ring readable static.
- [x] **1.4.4 Resize text / 1.4.10 Reflow** — `baseFontSize` control already in store; layout reflows to
      320px CSS width with no horizontal scroll.
- [x] **4.1.2 Name/role/value** — `aria-pressed` on theme switch & chips, `aria-label` on icon-only
      controls, `aria-live="polite"` toast for "Logged · Undo" (no focus steal).
- [x] **2.1.1 Keyboard** — full tab order matches visual order; `N` opens capture; Esc closes overlays.
- [x] **Forms** — visible labels, inline-validate on blur, error states ≥4.5:1 with icon + text.

---

## 9. Motion & Interaction Notes

| Interaction | Spec |
|---|---|
| Capture submit | input clears, toast slides up 220ms ease-out + **Undo** (5s), new timeline item fades/staggers in |
| Habit tick | circle fill + checkmark scale 0→1 spring; streak number counts up; subtle haptic on mobile |
| Mood select | tap scales 1.04 + accent ring glow; persists silently |
| Theme switch | instant token swap; cards crossfade 200ms; **no layout shift** |
| Timeline expand | shared-element height grow, photo fades in; reduced-motion = instant |
| Reward (streak milestone) | reuse existing `reward-particle` confetti, gated by `animationsEnabled` |
| All | 150–300ms, `--ease-soft`; exit ~70% of enter; interruptible; killed under reduced-motion |

---

## 10. Developer Handoff — wiring the two themes into the live app

The redesign is intentionally **token-shaped** so it drops into the existing architecture. Three edits:

### 10.1 `lib/store.ts` — extend the union + add two configs
```ts
export type ThemeName = 'dark' | 'electric' | 'midnight' | 'pink' | 'aozora' | 'grace'
// (light/dark variants handled by an added `mode: 'auto'|'light'|'dark'` flag, OR ship
//  aozora=dark-primary, grace=light-primary and add `aozora-day` / `grace-night` as siblings.)

aozora: {
  name: 'aozora', label: 'Aozora',
  bg: '#070b16', bgGradientEnd: '#0c1426',
  surface: 'rgba(20,30,54,.66)', surfaceHover: 'rgba(30,44,78,.72)',
  border: 'rgba(96,140,224,.18)',
  text: '#e8eefc', textDim: '#a7b6d6', textMuted: '#8493b6', // all AA on bg
  accent: '#3da9fc', accentHover: '#5fbcff', accentText: '#04101f',
  scrollbarTrack: '#070b16', scrollbarThumb: '#1e2c4e', scrollbarHover: '#3da9fc',
  cardBg: 'rgba(16,24,44,.72)', inputBg: 'rgba(5,9,20,.55)', sidebarBg: 'rgba(7,11,22,.85)',
},
grace: {
  name: 'grace', label: 'Grace & Bloom',
  bg: '#fff5f8', bgGradientEnd: '#fde8f1',
  surface: 'rgba(255,255,255,.82)', surfaceHover: '#ffffff',
  border: 'rgba(214,120,168,.22)',
  text: '#5a2240', textDim: '#8a4d6e', textMuted: '#a26a89', // AA on blush
  accent: '#d6498c', accentHover: '#c23a7c', accentText: '#ffffff',
  scrollbarTrack: '#fde8f1', scrollbarThumb: '#f3c4d9', scrollbarHover: '#d6498c',
  cardBg: 'rgba(255,255,255,.92)', inputBg: '#fffafc', sidebarBg: 'rgba(255,245,248,.9)',
},
```
> **Note:** `grace` is the app's first **light** theme. Audit any component using hardcoded
> `text-white` / `bg-black` / `rgba(255,255,255,…)` and replace with `--theme-*` tokens (grep:
> `text-white|bg-black|#fff|#000`). The prototype's full token set (with `--grad-hero`, `--font-*`,
> `--radius`, motif opacity) lives in `prototype.html` `<style>` and is the source of truth.

### 10.2 `ThemeProvider` — apply theme-specific fonts + motif + radius
Where the provider injects `ThemeConfig` into CSS vars, also set per-theme `--font-display`,
`--font-body`, `--radius`, and a `data-theme` attribute on `<html>` so the motif `::before` and
microcopy hooks (`.aozora-only` / `.grace-only`, kana) can key off it. Add the two font families to
the `<head>` `<link>` (Rajdhani, Noto Sans JP, Cormorant Garamond, Nunito Sans).

### 10.3 New UI pieces to build (reuse existing primitives where possible)
| Piece | Notes |
|---|---|
| `QuickCapture` | Sticky input + chips; posts to a unified `moments` insert; optimistic + Undo toast |
| `Timeline` | Promote existing day data into the spine layout; lens switcher; "On This Day" |
| `MoodScale` | 5-point, one-tap, optional reason; feeds existing mood store |
| `StreakBadge` | Add **grace-day** logic (1 forgiven miss/week) so streaks never shame |
| `ThemeSwitcher` | Extend Settings: Aozora/Grace + light/dark variant + accent + density |
| Verse/Resolve card | Grace → existing `/api/scripture/daily`; Aozora → curated resolve list |

**Data:** a single `moments` table (type, body, mood, tags[], photo_url, created_at, user_id) unifies
capture; RLS `user_id default auth.uid()` per the existing pattern. Habits/goals/journal already exist.

### 10.4 Definition of done
Typecheck + lint + build green · both themes pass AA contrast (axe) · reduced-motion verified ·
375/768/1024/1440 verified · no hardcoded colors in touched components · capture median <10s.

---

## 11. Microcopy Library

| Surface | Aozora (anime) | Grace & Bloom (faith) |
|---|---|---|
| Onboarding | "Welcome, operator. Let's set up your log." | "Welcome, friend. Let's make a gentle space for you." |
| Empty timeline | "No moments yet. Capture your first." | "Your story starts here. Add a quiet first moment." |
| Quick log placeholder | "What just happened?" | "What's on your heart?" |
| Log success toast | "Logged · 9:24 PM · Undo" | "Saved with grace · Undo" |
| Mood prompt | "Status check. How are you running?" | "How is your heart today?" |
| Streak (active) | "24-day streak. Secured." | "24 days of showing up — gently done." |
| Streak (missed) | "Grace day used. Streak holds." | "It's okay. Grace covers today. 💗" |
| Insights | "Week recap — your stats are in." | "Looking back on a week of small gifts." |
| Goals | "Set your next mission." | "What are you hoping toward?" |
| Reminder push | "Daily log pending. 30 seconds." | "A gentle nudge to pause and reflect." |
| Theme switch | "Theme: Aozora engaged." | "Theme: Grace & Bloom." |
| Profile/privacy | "Your data. Your vault. Encrypted." | "Your reflections are private and safe." |

---

## 12. Phased Roadmap

| Phase | Scope | Outcome |
|---|---|---|
| **0 · Foundations (1–2d)** | Add `aozora`+`grace` to store; per-theme fonts/radius/motif in ThemeProvider; audit hardcoded colors for the first light theme | Both themes selectable; nothing breaks |
| **1 · Capture & Timeline (3–5d)** | `moments` table + `QuickCapture` (input/chips/voice/photo) + Undo; promote Timeline to spine layout + lenses | <10s capture; timeline is the centerpiece |
| **2 · Reflect (3–4d)** | MoodScale, Insights spark + weekly recap (opt-in AI), grace-day streaks, "On This Day" | Gentle reflection loop closed |
| **3 · Polish & motion (2–3d)** | Reward particles, stagger, shared-element timeline expand, mobile FAB long-press capture | Feels alive, still calm |
| **4 · Privacy & customization (2d)** | Export/lock/delete, local-only mode, theme customization (accent/density), reminder scheduling | Strong data control |
| **5 · QA & a11y sign-off (1–2d)** | axe + manual AA pass, reduced-motion, 4 breakpoints, both themes | WCAG 2.2 AA confirmed; ship |

---

### Open assumptions (proceeding, not blocking)
1. Light theme is new ground — Phase 0 includes a hardcoded-color audit. If most components already
   use tokens, this collapses to <1 day.
2. "Variants" shipped as sibling themes (`aozora`/`aozora-day`, `grace`/`grace-night`) for simplicity;
   can later fold into a single `mode` flag if you prefer auto light/dark.
3. Voice capture assumes the browser Web Speech API (free, no new dependency); falls back to text.
4. Resolve-card content for Aozora is a small curated list (mirroring `scriptureThemes.ts`); swap for
   your own quotes anytime.
