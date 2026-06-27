# Blueprint Architecture

A personal devotional + productivity companion for two users. Pre-launch,
free-tier, privacy-first.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (Pages Router) + React 19, Turbopack |
| Styling | Tailwind CSS v4 + CSS-variable design tokens (`styles/globals.css`) |
| State | Zustand 5 (`lib/store.ts`, `lib/dataStore.ts`, `lib/gamificationStore.ts`, …) |
| Backend | Supabase (Postgres + Auth + Storage), Row Level Security on every table |
| AI | Free GitHub Models endpoint via `lib/aiClient.ts` (smart `gpt-4o`, fast `gpt-4o-mini`) |
| Hosting | Vercel (Hobby): API routes as serverless fns, daily `/api/health` cron |
| Context engine | Graphify knowledge graph (`graphify-out/`, see [CONTEXT.md](CONTEXT.md)) |

## Shape

```
pages/                Pages Router screens (dashboard, goals, gym, scripture, …)
  api/                Serverless API routes (AI coaches, calendar, scripture, …)
components/           Presentational + interactive UI (Card, Button, MuscleMap, …)
hooks/                Data + feature hooks (useGoals, useGym, useScripture, …)
lib/                  Core: aiClient, apiAuth, dataStore, store (themes),
                      muscles, scriptureThemes, encryption, oauthState
supabase/             schema.sql + security-and-performance.sql + migrations
docs/                 Audit, research, UX notes
```

## Data & auth

- **Auth:** Supabase email/password; a single global gate in `pages/_app.tsx`.
- **Authorization:** RLS on every table (`auth.uid() = user_id`). `user_id`
  defaults to `auth.uid()` on insert (see `supabase/fix-user-id-defaults.sql` —
  applied) so client inserts satisfy RLS. `habits`/`habit_logs` RLS added in
  `supabase/enable-rls-habits.sql`.
- **Server access:** API routes use `authGuard()` (`lib/apiAuth.ts`) for the user
  JWT and `getServiceClient()` only for explicitly user-scoped service work.
- **Secrets:** OAuth state is HMAC-signed (`lib/oauthState.ts`); calendar tokens
  are AES-encrypted at rest (`lib/serverCrypto.ts`, fail-closed).

## AI subsystem

All AI flows go through `lib/aiClient.ts` (one free endpoint, JSON-mode with
defensive parsing + retry). Routes: goal coach/planner (date-aware), finance,
mental, body-stats, notes, documents, daily briefing, chat, copilot, quests.
See [docs/AUDIT-2026-06.md](docs/AUDIT-2026-06.md) for the consolidation rationale.

## Devotional subsystem

`lib/scriptureThemes.ts` (curated themes) → `/api/scripture/daily` (date-
deterministic verse from key-less bible-api.com) → `useScripture` → `ScriptureCard`.
Topic-based and encouraging rather than random. See
[docs/research-and-roadmap.md](docs/research-and-roadmap.md).

## Fitness subsystem

`lib/muscles.ts` maps logged exercises → muscles + recovery model; `MuscleMap`
(recovery heat) and `BodyMapSelector` (gamified body quests) render it. Gym data
via `useGym` → `workouts` / `workout_logs`.

## Integrations subsystem

Free third-party integrations, all mirroring the Calendar pattern (signed OAuth
state → AES-encrypted tokens in a `*_connections` table → user-scoped server
helper → `useX` hook → Settings card). See [INTEGRATIONS_SETUP.md](INTEGRATIONS_SETUP.md).

| Integration | Key files | Storage |
|---|---|---|
| **Web Push** (VAPID) | `lib/serverPush.ts`, `public/sw.js`, `api/push/*`, `hooks/usePush.ts` | `push_subscriptions` |
| **Wger** (exercises) | `lib/wger.ts`, `api/exercises/search`, `hooks/useExerciseSearch.ts` | none (proxy) |
| **Google Fit** (+ Galaxy Watch via Health Connect bridge) | `lib/serverFitness.ts`, `api/fitness/*`, `hooks/useFitness.ts` | `fitness_connections`, `fitness_samples` |
| **Unsplash** (imagery) | `lib/unsplash.ts`, `api/images/search`, `hooks/useUnsplash.ts` | reuses `motivations.image_url` |
| **Spotify** (playlist embed) | `lib/serverSpotify.ts`, `api/spotify/search`, `components/SpotifyFocus.tsx` | none (client-credentials) |

New tables + RLS live in `supabase/integrations.sql`. API keys never reach the
client — Unsplash/Spotify/Wger calls are server-side proxies behind `authGuard`.

## Cross-cutting

- **Design system:** tokens + utility classes in `globals.css`; documented in
  [UX_GUIDE.md](UX_GUIDE.md). Four themes via `ThemeProvider` + `lib/store.ts`.
- **Resilience:** `supabaseWithRetry`, `lib/retry.ts`, `ErrorBoundary`,
  `handleError` + toasts.
- **Reads bounded:** time-series queries use a rolling window (`lib/dataStore.ts`).
- **CI:** `.github/workflows/ci.yml` (typecheck, lint, build, analytics test).

## Known constraints

- In-memory rate limiter is per-instance (fine at 2-user scale).
- Free Supabase auto-pauses after ~7d idle; first request after wake can 5xx for
  ~30–60s (the daily cron keeps it warm once deployed).
