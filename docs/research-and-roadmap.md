# Research: devotional / habit / AI-knowledge apps → applied patterns

Research into how leading apps in Blueprint's space drive engagement, and which
patterns we adopted vs. propose. Sources at the bottom.

## What the leaders do

**Devotional / Bible (YouVersion, Glorify, Pray.com, BibleMate)**
- Daily verse with a *theme* and short application note — not a random verse.
- Reading **plans** (guided micro-goals) reduce daily decision friction.
- **Streaks** + gentle reminders create a daily cue→reward loop.
- "Quiet space, not a social feed" — calm, low-chrome UI.
- Low-friction onboarding: pick a focus, get an immediate first win.

**Habit trackers (Streaks, Habitica, Finch, Reclaim)**
- Prominent **streak counter**; the fear of resetting drives return visits.
- **Calendar grid** with today highlighted = at-a-glance progress.
- Personalized / smart reminders; AI-driven nudges from user patterns.
- Gamification (XP, levels, avatars) for those who respond to "leveling up".
- Each completion gives a small dopamine hit (growing chain of squares).

**AI knowledge tools (Notion AI, Mem, Reflect)**
- A knowledge graph / backlinks surface non-obvious connections.
- Context-aware retrieval: pull only the relevant slice per task.

## Applied in this pass

- ✅ **Topic-based encouraging daily scripture** with theme chip + application
  copy (`/api/scripture/daily`, `ScriptureCard`) — replaces random verses.
- ✅ **Knowledge graph context engine** (Graphify) with layered retrieval
  (CONTEXT.md) — the AI-knowledge-tool pattern.
- ✅ **Calmer, theme-coherent UI** — design tokens + UX_GUIDE, fixed the
  body-map illustration, smooth verse transitions.
- (already present) streaks/gamification (habits + hunter profile), reminders
  (`notificationRules`), AI nudges (copilot, coaches).

## Proposed next (highest engagement-per-effort)

1. **Reading plans** — multi-day themed scripture plans (extend
   `scriptureThemes` to ordered plans); show "Day 3 of 7". Mirrors YouVersion's
   top retention driver.
2. **Unified streak + calendar-grid widget** on the dashboard spanning habits +
   devotional + gym (one momentum surface).
3. **Onboarding flow** — first-run: pick focus areas + a verse theme + one habit,
   yielding an immediate first win.
4. **Smart daily reminder** — time-aware push/email at the user's usual active
   hour (the date-aware engine already exists).
5. **Verse → reflection journal** — one-tap "reflect" saves a note tied to the
   day's verse (closes the application loop).
6. **Share card** — export the daily verse as an image (devotional sharing
   pattern) — opt-in, no auto-posting.

---

## Possible FREE integrations

Grouped by effort. All have free tiers usable at 2-user scale.

### Already in use (free)
- **Supabase** — DB/Auth/Storage (free tier).
- **GitHub Models** — AI inference (free) via `lib/aiClient.ts`.
- **bible-api.com** — verse text, key-less (daily scripture).
- **Google Calendar API** — OAuth calendar sync (free quota).
- **Graphify** — local knowledge graph (free, OSS).

### Quick wins (key-less or generous free tier)
- **API.Bible (scripture.api.bible)** — 2,500+ versions, free key; richer than
  bible-api.com (multiple translations, audio refs) for the devotional plans.
- **ESV API** — already wired in `scripture/search.ts` (free key); good for a
  premium English translation.
- **Open-Meteo** — key-less weather; contextual "good day for an outdoor workout"
  nudges. 
- **Frankfurter / exchangerate.host** — key-less FX rates for the finance module
  (multi-currency).
- **Quotable / ZenQuotes** — key-less motivational quotes (already have a quotes
  route; swap to a maintained source).
- **Web Push (VAPID)** — browser push notifications, fully free (no vendor) for
  habit/devotional reminders.
- **Resend / Brevo free tier** — transactional email (daily verse digest, goal
  reminders).

### Medium effort
- **Plausible (self-host) or Umami** — privacy-friendly, free analytics.
- **Sentry free tier** — error tracking (wire into `ErrorBoundary`).
- **Wger API** — free open exercise/muscle database to power an exercise library
  + autocomplete feeding the muscle map.
- **Nutritionix / Open Food Facts** — Open Food Facts is key-less; nutrition
  logging for the body/fitness module.
- **Google Fit / Fitbit Web API** — import steps/sleep/weight (free dev tier) to
  auto-fill body stats.
- **ical/.ics feeds** — subscribe to read-only calendars without OAuth.

### Nice-to-have
- **Unsplash API** — free imagery for motivation board / verse share cards.
- **Spotify Web API** — free tier; focus/worship playlist embed for focus
  sessions.
- **GitHub / Linear / Todoist APIs** — pull external tasks into the task module.
- **Telegram Bot API** — free, simplest channel for daily verse + reminders.

## Sources

- [YouVersion / Bible app UX (FaithTime)](https://www.faithtime.ai/content/general/best-apps-for-consistent-bible-reading/)
- [Best daily devotional apps (BibleMate)](https://bibleinyear.com/blog/best-daily-devotional-apps)
- [faith.tools — Bible apps](https://faith.tools/bible)
- [Best habit tracker apps (Clockify)](https://clockify.me/blog/productivity/best-habit-tracker-apps/)
- [Habit tracker calendar UX (RapidNative)](https://www.rapidnative.com/blogs/habit-tracker-calendar)
- [Best habit tracker apps (Reclaim)](https://reclaim.ai/blog/habit-tracker-apps)
