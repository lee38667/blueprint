# Blueprint

Blueprint is a personal life management system built with Next.js, TypeScript, Tailwind CSS, Supabase, and AI-powered workflows. It combines productivity, wellness, finance, knowledge management, motivation, and schedule awareness in one authenticated multi-user application.

## What The System Includes

### Core platform
- Email/password authentication with Supabase Auth
- Protected application routes with auth guard redirects
- Multi-user data isolation with Row Level Security (RLS)
- Responsive dashboard, sidebar navigation, toasts, dialogs, skeleton loaders, and reusable UI primitives
- Theme selection, animation toggle, font-size control, session timeout setting, and Google Calendar connection management

### Dashboard and daily operating system
- Unified dashboard with financial snapshot, quick tasks, body stats, motivation, scripture, AI copilot, and AI insights
- Daily briefing card generated from real user data
- Daily focus recommendations informed by tasks, goals, moods, habits, and calendar context
- Automatic notification-rule evaluation on dashboard load
- Weekly body trend charts for weight and sleep

### Tasks
- Create, update, and soft-delete tasks
- Task status management: `todo`, `in_progress`, `done`
- Priority tracking: `low`, `normal`, `high`
- Goal-linked tasks
- Filters by status, priority, and project
- Weekly summary cards
- Productivity analytics: completion rate, overdue count, active count, weekly velocity, priority mix, and focus projects
- Pagination for task lists
- AI task intelligence card
- CSV export utility available in the codebase for task data

### Goals
- Goal creation with category, target date, and status
- Goal status updates
- Milestones per goal
- Subtasks per milestone
- Goal progress bars based on milestone completion
- Milestone progress bars based on subtask completion
- Linked task progress inside each goal
- AI goal coach with momentum score, risks, summary, and next steps
- AI goal intelligence card
- CSV export utility available in the codebase for goal data

### Habits
- Daily and weekly habit tracking
- One-click completion logging for today
- Backfill logging across a 35-day heatmap
- Streak calculation
- Completion map generation
- Automatic habit-streak-risk notifications

### Notes and journal
- Rich note and journal entry creation
- Markdown rendering for note content
- Tagging and tag-based filtering
- Search across title, content, and AI summaries
- Optional client-side encryption for sensitive entries
- Manual decryption with passphrase input
- AI note analysis with summary, mood, sentiment, keywords, action items, and suggested tags
- Pagination for note lists
- CSV export for notes
- Soft delete support

### Mental health and wellness
- Mood logging with mood label, mood score, stress score, and optional notes
- AI reflection after mood logging
- Mental coach with encouragement, burnout risk, suggested actions, and grounding tips
- Heuristic wellness signals such as average mood, average stress, negative streaks, and burnout likelihood
- Body stats logging for weight, sleep, water intake, and stress
- AI body-stats coach with weekly wellness insights
- Recent body metric timeline on the dashboard

### Gym and physical training
- Workout template creation with name, day, and notes
- Workout logging with notes and JSON metrics
- Workout history and per-workout log counts
- Recent gym log display

### Finance
- Balance tracking with historical snapshots
- Finance history log
- Income and expense tracking with category and notes
- Savings target tracking by month
- Category trend analysis
- Three-month balance projection
- Cashflow trend indicator
- AI finance coach with outlook, guardrails, opportunities, and cashflow score
- CSV export utility available in the codebase for finance data

### Calendar and schedule management
- Google Calendar OAuth connection flow
- Encrypted storage of calendar access and refresh tokens
- Calendar week view and month view
- Upcoming event list
- Manual event creation from the app
- All-day and timed event support
- Refresh and disconnect flows
- Calendar-aware AI planning and chat responses
- AI-generated calendar actions that can be confirmed into real Google Calendar events

### AI chat and memory
- Persistent multi-conversation AI chat UI
- Conversation history with date grouping and search
- AI responses grounded in user tasks, goals, moods, finances, habits, body stats, notes, memories, and calendar events
- Automatic extraction of durable user memories from chats
- Memory list with categories and deletion support
- AI-generated calendar scheduling actions inside chat
- Suggested prompts for planning, reflection, and scheduling
- Chat persistence and memory schema documented in [CHAT_SETUP.md](./CHAT_SETUP.md)

### Documents vault and storage
- File upload to Supabase Storage
- AI document summarization on upload
- Talking points and keyword extraction
- Document type classification (`general`, `cv`, `certificate`, `reference`)
- Secure signed share links with expirations
- CV version history tracking
- Storage bucket bootstrap endpoint at `POST /api/storage/setup`

### Scripture
- Scripture lookup through the ESV API
- Favorite verse saving and removal
- Search by reference
- Dashboard scripture card integration

### Motivation and life design
- Motivation board for quotes and inspiration snippets
- Random quote support via API with fallback quotes
- Life areas CRUD for high-level life categories like health, career, and relationships
- Notification center for reminders with snooze and done states
- AI-supported daily briefing and focus support across the app

### Gamification
- Daily/periodic quests with AI-assisted generation and a deterministic fallback
- XP and level progression with level-up modal celebration
- Gamification radar and dashboard card surfacing progress across life areas
- Server-side progress application tied to real actions (e.g. logged body workouts)

### Skills and content records
- Skills tracking view with skill level badges
- Full skill CRUD (create, update, delete) with level and category
- Content/document records stored in Supabase
- Resume/CV-specific versioning support

### Search and command UX
- Global VS Code-style search/command component
- Search across pages, tasks, goals, notes, and scripture favorites
- Fuse.js fuzzy matching
- Keyboard-friendly modal/search interactions

## AI Features

Blueprint includes several AI workflows powered by the configured AI provider key:

- Daily briefing generation
- AI copilot mood insight, focus advice, structured system-wide brain analysis, and natural-language data extraction
- Goal coaching
- Finance coaching
- Mental health coaching
- Body stats coaching
- Note analysis
- Document summarization
- Context-aware AI chat with memory and calendar scheduling support

The system currently uses `AI_API_KEY` as the primary key and falls back to `GITHUB_DEVELOPER_AI_KEY` when available.

## Tech Stack

- Next.js 16 (Turbopack)
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase database, auth, and storage
- Zustand for UI state
- Chart.js and `react-chartjs-2`
- Google Calendar API via `googleapis`
- Fuse.js for fuzzy search
- `react-hook-form` for auth forms
- `react-markdown` for note rendering

## Project Structure

```text
blueprint/
|- components/        Reusable UI components and cards
|- hooks/             Data, AI, analytics, and integration hooks
|- lib/               Stores, utilities, exports, encryption, retry, chart helpers
|- pages/             App routes and API routes
|- supabase/          Schema, security, and performance SQL
|- styles/            Global styling
|- types/             Shared TypeScript models
|- public/            Static assets
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

AI_API_KEY=your_ai_provider_key
# Optional fallback
GITHUB_DEVELOPER_AI_KEY=your_ai_provider_key

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google Calendar integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
ENCRYPTION_KEY=generate_a_strong_random_hex_key

# Scripture integration
ESV_API_KEY=your_esv_api_key
```

### 3. Run the database SQL

Run these files in Supabase SQL Editor in this order:

1. `supabase/schema.sql`
2. `supabase/security-and-performance.sql`

These create the core tables, enable RLS, add soft-delete columns, add audit fields, and create performance indexes.

### 4. Optional setup steps

Run these if you want the related features:

1. Chat persistence and AI memory: follow [CHAT_SETUP.md](./CHAT_SETUP.md)
2. Google Calendar OAuth setup: follow [CALENDAR_SETUP.md](./CALENDAR_SETUP.md)
3. Documents bucket setup: call `POST /api/storage/setup` or create the `documents` bucket manually in Supabase Storage

### 5. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## API Routes

### AI and productivity
- `POST /api/ai-copilot`
- `POST /api/chat`
- `POST /api/daily-briefing`
- `POST /api/goals/coach`
- `POST /api/finance/coach`
- `POST /api/mental/coach`
- `POST /api/body-stats/advice`
- `POST /api/notes/analyze`
- `POST /api/documents/summarize`
- `GET /api/quotes/random`

### Calendar
- `GET /api/calendar/auth`
- `GET /api/calendar/callback`
- `GET /api/calendar/events`
- `POST /api/calendar/create-event`
- `DELETE /api/calendar/disconnect`

### Gamification
- `GET /api/gamification/quests`
- `POST /api/gamification/complete-quest`
- `POST /api/workouts/log-body`

### Utility and integration
- `GET /api/scripture/search`
- `POST /api/notifications/evaluate`
- `POST /api/storage/setup`
- `GET /api/health`

## Security and data model

### Security features
- Supabase-authenticated multi-user access
- Row Level Security across core tables
- User-scoped policies for owned records
- **All AI and data API routes require a verified Supabase access token** (`Authorization: Bearer`), enforced by a shared `lib/apiAuth.ts` guard. Client calls go through `lib/apiClient.ts` (`authedFetch`).
- **Per-user rate limiting** on AI endpoints to prevent abuse of the AI provider key
- **User-scoped server-side calendar access** (`lib/serverCalendar.ts`) — the service-role client is only ever queried with a verified user id, never unscoped
- **Fail-closed encryption** (`lib/serverCrypto.ts`) — stored OAuth tokens are encrypted with `ENCRYPTION_KEY`, which must be set (no hardcoded fallback)
- Soft delete support for notes, tasks, goals, motivations, content, and finance logs
- Private document storage with signed URL sharing

### Core data domains
- Tasks
- Goals, milestones, subtasks
- Habits and habit logs
- Notes
- Mood logs
- Body stats
- Workouts and workout logs
- Finance summary, finance history, finance logs, savings targets
- Notifications
- Life areas
- Motivation items
- Scripture favorites
- Content/documents
- AI insights
- Calendar connections
- Optional chat conversations, chat messages, and chat memories

## Current status

Implemented now:
- Authenticated multi-user app shell
- Productivity, wellness, finance, motivation, scripture, calendar, documents, and AI chat modules
- AI-generated insights across notes, goals, finance, body stats, mental health, daily briefing, and system-wide planning
- Google Calendar connection and event creation
- Supabase-backed storage and sharing for documents
- Gamification with quests, XP/levels, and a progress radar
- Skills CRUD and profile customization
- Email/password authentication (single-factor)
- Search, pagination, confirmations, theming, and responsive UI support

Still lightweight or partial:
- Some CSV export helpers exist in the codebase but are not exposed on every related page yet

## License

MIT

## Latest UX Enhancements

- ADHD-friendly task initiation with automatic 2-5 minute micro-steps and one-tap tiny starts
- Energy-aware `next smallest step` prompts for goals and tasks based on mood and stress trends
- Visual progress rings for goals and milestones in addition to linear progress bars
- Adaptive focus sessions with Pomodoro, 5-minute reset mode, and spoken body-doubling prompts
- Focus zones on the dashboard so non-essential panels can be hidden during deep work
- Instant reward feedback with confetti-style bursts plus motivation-board powered encouragement on task completion
- Voice input controls on major capture flows including tasks, notes, goals, and reminders
- Infinite-scroll style loading for tasks and notes to reduce pagination friction
- High-contrast theme mode for stronger priority and status visibility
- Contextual notification cards with `Why now?`, gentle-poke explanations, and quick snooze windows
- Real-time attention coaching that surfaces easy wins, procrastination friction, CBT-style reframes, and hyperfocus warnings
