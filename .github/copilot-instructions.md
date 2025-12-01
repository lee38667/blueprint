
# Blueprint AI Agent Guide
## Architecture & Layout
- Next.js 13 pages router (see `pages/*`) keeps each feature isolated; `pages/dashboard.tsx` shows the canonical layout with `Sidebar` + `Navbar` + content grid.
- Every module route (`pages/notes`, `pages/gym`, etc.) reuses `Sidebar`, `Navbar`, and `Card` to guarantee consistent spacing and theming—mirror this shell when adding new pages.
- Feature-specific hooks live in `hooks/*` and are imported directly into pages rather than using global data stores; keep fetch logic near the page that consumes it.
- `components/VSCodeSearch.tsx` implements the fuzzy overlay navigation; update its `items` list when introducing new routes so search stays complete.
- Mobile actions rely on `components/FloatingActionButton.tsx`; prefer that component over ad-hoc buttons when exposing quick-add flows.

## Data & State
- Supabase access is centralized in `lib/supabaseClient.ts`; it expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to be present before any hooks run.
- Hooks such as `hooks/useNotes.ts` and `hooks/useGym.ts` follow the pattern `useEffect → supabase query → local state`; reuse the mounted-flag pattern to avoid state updates after unmount.
- Table names and columns must match `supabase/schema.sql` (`notes`, `life_areas`, `finance_summary`, etc.); align new queries with that schema to avoid runtime typos.
- Lightweight UI state (sidebar collapse, dark mode) sits in `lib/store.ts` via Zustand; extend that store instead of introducing new contexts for layout toggles.
- `hooks/useAICopilot.ts` currently simulates async work—drop in real AI calls there to keep the rest of the dashboard unchanged.

## Styling & UX
- Tailwind is configured in `tailwind.config.js` with custom colors (`electric`, `neon`, `teal`) and fonts; use those tokens instead of hard-coding hex values.
- Global look-and-feel (dark background, `card-skeleton` placeholder, typography stack) is defined in `styles/globals.css`; verify new utility classes do not fight these rules.
- Buttons that need the glowing accent should import `components/Button.tsx`; ad-hoc buttons should still include hover scale + rounded corners per design.
- `_app.tsx` wraps every page in `framer-motion`'s `MotionConfig`; when adding animations, prefer `framer-motion` primitives so the global config applies consistently.

## Supabase & Auth
- Follow README onboarding: run `supabase/schema.sql` inside Supabase, then enable RLS per table so hooks that call `.select('*')` only see the current user.
- Auth pages (`pages/login.tsx`, `pages/register.tsx`) use `react-hook-form` and Supabase password auth; extend those forms rather than reimplementing validation logic.
- Storage-facing features (CV uploads, content library, gym media) are not wired yet—plan to use Supabase Storage buckets that mirror the tables defined in `schema.sql`.
- Financial widgets expect `finance_summary` rows with `balance`, `savings`, etc.; seed that table before demoing the dashboard to avoid null UI states.
- Any server-side tasks should use `SUPABASE_SERVICE_ROLE_KEY` (optional env) but keep it off the client bundle.

## Dev Workflow & Tips
- Run `npm run dev` for local work, `npm run lint` before commits, and `npm run build` to confirm Next.js compiles cleanly; there are currently no automated tests.
- `.env.local` is ignored by git—populate it early or Supabase hooks will resolve to empty strings and throw auth errors.
- When introducing a new module, add its nav entry in `components/Sidebar.tsx`, search entry in `VSCodeSearch`, and scaffold a matching hook under `hooks/`.
- Keep cards responsive by using the existing `grid grid-cols-1 md:grid-cols-*` pattern and stacking sections under `main` containers just like `pages/notes/index.tsx`.
- README start-up steps are the source of truth for onboarding; reference it when scripting setup automation or writing CI docs.