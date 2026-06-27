# Integrations Setup

Setup for the five free integrations added in this pass: **Web Push**, **Wger**,
**Google Fit (+ Galaxy Watch 4)**, **Unsplash**, and **Spotify**.

Each section flags **🔧 MANUAL** steps you must do yourself (create keys, run SQL,
configure a phone). Everything else is already wired in code.

> **Run the DB migration first (covers Push + Google Fit):**
> In the Supabase SQL editor, run [`supabase/integrations.sql`](supabase/integrations.sql).
> It creates `push_subscriptions`, `fitness_connections`, and `fitness_samples`
> with RLS. Idempotent — safe to re-run. (Wger, Unsplash, Spotify need no tables.)

---

## 1. Web Push (VAPID) — browser notifications

Free, no vendor. Reminders reach you even when the tab is closed.

**🔧 MANUAL**
1. Generate a VAPID keypair (once):
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Add to `.env.local` (and to Vercel env for production):
   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
   VAPID_PRIVATE_KEY=<private key>
   VAPID_SUBJECT=mailto:you@example.com
   ```
3. Run `supabase/integrations.sql` (if not already).
4. (Optional) Add icon files `public/icon-192.png` for the notification icon —
   it falls back gracefully if missing.

**How to use:** Settings → Integrations → Push Notifications → **Enable**, then
**Test**. New auto-generated reminders also fire a push (see
`hooks/useNotifications.ts` → `/api/push/send`).

Requires HTTPS (or `localhost`). iOS Safari requires the site be added to the
Home Screen first.

---

## 2. Wger — exercise autocomplete

Free, **no key required**. Powers exercise-name autocomplete in the gym logger.

**🔧 MANUAL:** none. Open the gym log modal and start typing an exercise name —
suggestions come from the wger catalog via `/api/exercises/search`.

---

## 3. Google Fit (+ Galaxy Watch 4) — steps / sleep / heart rate / weight

Reads daily metrics into the dashboard. **This is also how your Galaxy Watch 4
data gets in** — Samsung Health has no public web API, so the watch bridges
through Google Fit.

### 3a. Google Cloud (🔧 MANUAL)
1. In [Google Cloud Console](https://console.cloud.google.com/) use the same
   project as Google Calendar.
2. **APIs & Services → Library →** enable **Fitness API**.
3. **OAuth consent screen →** add these scopes (read-only):
   `fitness.activity.read`, `fitness.body.read`, `fitness.heart_rate.read`,
   `fitness.sleep.read`. Add yourself as a Test user.
4. **Credentials →** open your existing OAuth client (or create one) and add the
   redirect URI:
   - `http://localhost:3000/api/fitness/callback` (dev)
   - `https://<your-domain>/api/fitness/callback` (prod)
5. `.env.local` (reuses your existing Google client id/secret):
   ```env
   GOOGLE_FIT_REDIRECT_URI=http://localhost:3000/api/fitness/callback
   ```
6. Run `supabase/integrations.sql` (if not already).

### 3b. Bridge the Galaxy Watch 4 → Google Fit (🔧 MANUAL, on your phone)
The watch syncs to **Samsung Health**, which doesn't expose a cloud API. Route it
into Google Fit via **Health Connect**:
1. Install **Health Connect** (built into Android 14+, else from the Play Store).
2. **Samsung Health → Settings → Health Connect →** allow it to **write**
   steps, sleep, heart rate, and weight.
3. **Google Fit → Settings → Manage connected apps / Health Connect →** allow Fit
   to **read** those same data types from Health Connect.
4. Wear the watch, sync Samsung Health, and confirm the numbers appear in the
   Google Fit app. Once they're in Google Fit, this app can read them.

> Note: Google is gradually deprecating the Fit REST API in favor of Health
> Connect (which has no web API). This works today; if it's ever turned down
> we'd switch to a manual Samsung Health CSV import.

**How to use:** Settings → Integrations → **Connect Google Fit**, then on the
dashboard (Gym zone) the **Wearable** card shows your latest metrics — hit
**Sync now** to pull the last 7 days.

---

## 4. Unsplash — motivation board imagery

Free. Adds an image search to the Motivation Board.

**🔧 MANUAL**
1. Create an app at [unsplash.com/developers](https://unsplash.com/developers)
   (Demo tier = 50 requests/hour, plenty for 2 users).
2. Copy the **Access Key** into `.env.local`:
   ```env
   UNSPLASH_ACCESS_KEY=<access key>
   ```

**How to use:** Motivation Board → Add Inspiration → search images → click one to
pin it. Photographer attribution is stored automatically (Unsplash API terms).

---

## 5. Spotify — focus / worship playlist embed

Free. Search and embed public playlists on the dashboard (Motivation zone). Uses
the Client Credentials flow, so **no per-user Spotify login** is needed.

**🔧 MANUAL**
1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).
2. Copy the **Client ID** and **Client Secret** into `.env.local`:
   ```env
   SPOTIFY_CLIENT_ID=<client id>
   SPOTIFY_CLIENT_SECRET=<client secret>
   ```
   (No redirect URI needed for client-credentials search.)

**How to use:** Dashboard → enable the **Motivation** focus zone → **Focus
Sounds** card → search and pick a playlist. The choice is remembered per browser.
The card hides itself if Spotify isn't configured.

---

## Production (Vercel)
Add every env var above to the Vercel project (Production + Preview). Use the
production redirect URIs for Google, and a fresh VAPID keypair is fine to reuse
across environments. Re-run `supabase/integrations.sql` against the prod project.

## Quick reference — env vars
| Integration | Vars | Key needed? |
|---|---|---|
| Web Push | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | generated locally |
| Wger | — | no |
| Google Fit | `GOOGLE_FIT_REDIRECT_URI` (+ existing `GOOGLE_CLIENT_ID/SECRET`) | yes (Google) |
| Unsplash | `UNSPLASH_ACCESS_KEY` | yes |
| Spotify | `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | yes |
