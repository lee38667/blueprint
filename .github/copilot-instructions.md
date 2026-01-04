
# Blueprint AI Agent Guide

## Architecture & Layout
- **Next.js 13 pages router** isolates features in `pages/*/index.tsx`. Reference `pages/dashboard.tsx` for the canonical shell: `<Sidebar />` + `<Navbar />` + content grid.
- **Every module page** reuses `Sidebar`, `Navbar`, and `Card` components to guarantee consistent spacing, theming, and responsive layout. Mirror this pattern when adding routes.
- **Feature-specific hooks** (`hooks/useNotes.ts`, `hooks/useTasks.ts`, etc.) own their data fetching and live in the same boundary as their pages. Import directly into pages—no Redux/Context layers.
- **Search & Navigation**: `components/VSCodeSearch.tsx` fuzzy-searches pages, tasks, goals, and notes with Fuse.js. Update its `baseItems` array when adding routes to keep search complete.
- **Mobile quick-actions** use `components/FloatingActionButton.tsx`; prefer it over ad-hoc buttons for FAB-style interfaces.

## Data & State Management
- **Supabase initialization**: Credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) must exist in `.env.local` before any hook runs or auth fails silently.
- **Hook pattern** (see `useNotes.ts`, `useTasks.ts`): `useEffect(if !loaded) → supabase.from(...).select() → setState`. Use mounted-flag to prevent unmount state-updates.
- **Schema alignment**: All table names and columns must match `supabase/schema.sql` exactly (e.g., `notes`, `life_areas`, `body_stats`, `finance_summary`). Typos cause silent failures.
- **UI state layer** (`lib/store.ts`): Zustand store for sidebar collapse, dark mode, accent color, theme settings. Extend this instead of adding new Contexts.
- **AI integration points**: `pages/api/ai-copilot.ts` accepts mood/snapshot and calls an external AI API. `hooks/useAICopilot.ts` is a consumer placeholder—extend there to keep routing clean.
- **Data Stores** (optional): `lib/dataStore.ts` caches Supabase queries in Zustand; some hooks use it, some fetch directly. Prefer direct Supabase calls for new features.

## Styling & Color System
- **Tailwind tokens** (`tailwind.config.js`): Custom colors `electric` (#00E5FF), `neon` (#B300FF), `teal` (#00FFCC). **Always use these tokens instead of hex values.**
- **Global baseline** (`styles/globals.css`): Dark background, `selection:bg-electric`, `card-skeleton` placeholder animations. Verify new styles don't conflict.
- **Button variants**: Import `components/Button.tsx` for glowing accents. Standard buttons: add hover scale + rounded corners, matching `components/Modal.tsx` examples.
- **Animations**: `_app.tsx` wraps pages in Framer Motion's `MotionConfig`. Prefer `motion.div`, `AnimatePresence`, etc. so global settings apply consistently.
- **Responsive grid**: Use `grid grid-cols-1 md:grid-cols-{2,3,4}` for card layouts (see `pages/notes/index.tsx` and `pages/dashboard.tsx`).

## Supabase & Authentication
- **Initial setup** (README): Run `supabase/schema.sql` in Supabase SQL editor, then enable RLS on each table so `.select('*')` only returns the current user's rows.
- **Auth pages** (`pages/login.tsx`, `pages/register.tsx`): Use `react-hook-form` + Supabase password auth. Extend these forms rather than reimplementing validation.
- **Server-side tasks** (`pages/api/*`): Use `SUPABASE_SERVICE_ROLE_KEY` for admin queries, but **never expose it to the client bundle**.
- **Storage (planned)**: Future CV uploads and media files will use Supabase Storage buckets aligned with table schemas.
- **Demo data**: Finance widgets expect `finance_summary` rows with `balance`, `savings`, etc. Seed this table before showcasing.

## API & Integrations
- **AI API handler** (`pages/api/ai-copilot.ts`): Accepts `{ mood?, mode, snapshot? }` and calls external AI service. Prefers `AI_API_KEY` env, falls back to `GITHUB_DEVELOPER_AI_KEY`.
- **Coach endpoints** (`pages/api/goals/coach.ts`, `finance/coach.ts`): Similar pattern—accept context, call AI, return structured insights.
- **Analysis endpoints** (`pages/api/notes/analyze.ts`): Parse note content and return mood, sentiment, keywords, actionItems.

## Developer Workflow
- **Commands**:
  - `npm run dev` — Local dev server on localhost:3000
  - `npm run lint` — ESLint check (run before commits)
  - `npm run build` — Next.js build (confirms TypeScript + ESLint passes)
  - No automated tests currently exist
- **Environment setup**: `.env.local` is git-ignored. Populate early or auth silently fails; see README for required keys.
- **Adding a new module**:
  1. Create `pages/module/index.tsx` reusing Sidebar + Navbar + Card layout
  2. Create `hooks/useModule.ts` for data fetching
  3. Add nav entry in `components/Sidebar.tsx`
  4. Add search entry (page + items) in `components/VSCodeSearch.tsx`
  5. Extend `supabase/schema.sql` if new tables needed
- **Page structure**: Use `<main className="grid grid-cols-1 md:grid-cols-{n}">` for responsive cards, matching `pages/notes/index.tsx` as reference.
- **README is canonical**: Use it as the source of truth for setup, scripts, and architectural decisions.