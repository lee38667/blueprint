# Dashboard Mental Health, Motivation, Scripture, and AI Integration

This document explains how the mental health page works, how the dashboard motivation and daily scripture cards work, and exactly where AI is integrated today.

## 1. High-level architecture

The dashboard pulls together several independent features:

- The mental health feature is centered on mood logging plus two AI-backed analysis layers.
- The motivation area is a mix of a random quote widget, a user-managed motivation board, and AI insight cards.
- The daily scripture card is a content widget that fetches a random verse and lets the user save favorites.
- The main AI integration on the dashboard lives in the Blueprint AI card and the AI Copilot Intelligence card.

These systems sit next to each other on the dashboard, but they do not all use AI in the same way.

## 2. Dashboard composition

The dashboard page is defined in `pages/dashboard.tsx`.

Relevant dashboard cards:

- `AICopilotCard` is the interactive AI entry point.
- `MotivationQuoteCard` shows a random motivational quote.
- `ScriptureCard` shows a random scripture verse and favorite snippets.
- `AICopilotInsightsCard` shows broader AI-generated system insights.

The motivation section on the dashboard is rendered only when `focusZones.motivation` is enabled. Inside that block, the dashboard renders four cards together:

- `DailyFocusCard`
- `MotivationQuoteCard`
- `ScriptureCard`
- `AICopilotInsightsCard`

That means motivation and scripture are visually grouped with AI, but only the insights card is actually powered by the AI analysis pipeline.

## 3. Mental health page flow

The mental health page lives in `pages/mental/index.tsx`.

It combines three things:

- Mood data entry through `useMoodLogs()`
- A dedicated mental health coach flow through `useMentalCoach(logs)`
- A general AI copilot reflection flow through `useAICopilot()`

### 3.1 Mood logging

When the user submits the mood form:

- `handleAdd()` calls `addLog(...)` from `useMoodLogs()`
- The log stores fields such as `mood_label`, `mood_score`, `stress_score`, and `note`
- The form is reset after save
- If `moodLabel` exists, the page also calls `analyzeMood(moodLabel)`

This means a single mood submission can trigger both:

- persistence of the mood log
- a follow-up AI reflection request

### 3.2 Mental health AI coach path

The dedicated mental-health-specific AI path starts in `hooks/useMentalCoach.ts`.

What the hook does:

- It watches the last 7 mood logs.
- It computes local heuristics first:
- `avgMood`
- `avgStress`
- `negativeStreak`
- `burnoutLikely`
- It creates a `signature` string so the effect reruns only when the meaningful log content changes.
- It POSTs `logs: recent` to `/api/mental/coach`.

The API route is `pages/api/mental/coach.ts`.

What that route does:

- Requires an AI API key from `AI_API_KEY` or `GITHUB_DEVELOPER_AI_KEY`.
- Accepts the recent mood logs from the client.
- Compresses the last 7 entries into a plain-text summary string.
- Calls the OpenAI Chat Completions API at `https://api.openai.com/v1/chat/completions`.
- Uses model `gpt-5.1-mini`.
- Sends a system instruction asking for strict JSON with:
- `encouragement`
- `burnoutRisk`
- `actions`
- `regulationTips`
- Parses the returned JSON.
- Falls back to a simple non-personalized response if parsing fails.

So the mental page has a dedicated AI service specifically for emotional encouragement and burnout detection.

### 3.3 General AI reflection path on the mental page

The same page also uses `useAICopilot()` from `hooks/useAICopilot.ts`.

That hook exposes:

- `insights`
- `loading`
- `error`
- `analyzeMood(mood)`
- `focusToday(mood)`

On the mental page, only `analyzeMood()` is used. That sends a POST request to `/api/ai-copilot` with:

- `mode: 'mood'`
- `mood: <moodLabel>`

Inside `pages/api/ai-copilot.ts`, mood mode:

- validates the input
- builds a prompt like "The user reports feeling: X"
- sends the request to the Azure-hosted inference endpoint
- uses model `gpt-4o-mini`
- returns a short text insight string

This is separate from the dedicated mental coach route.

In practice, the mental health page therefore has two AI layers:

- a structured mental coach for encouragement and burnout watch
- a lightweight general reflection/copilot response

## 4. Dashboard AI integration

The main interactive AI card on the dashboard is `components/AICopilotCard.tsx`.

It has two modes:

- `record`
- `chat`

### 4.1 Record mode

Record mode uses `useAIRecorder()`.

This path is designed to turn natural language into structured app data such as:

- body stats
- mood entries
- finance entries
- tasks
- notes
- goals

The AI route handling this is also `pages/api/ai-copilot.ts`, but under `mode: 'record'`.

That mode:

- asks the model to extract structured JSON
- expects a strict schema
- returns an `action` object with `type`, `data`, and `confirmation`

So on the dashboard, AI is not only giving advice. It is also acting as a natural-language parser for app data entry.

### 4.2 Chat mode

Chat mode calls either:

- `analyzeMood(...)` for freeform advice
- `focusToday(...)` for time-aware prioritization

Important details from `AICopilotCard.tsx`:

- The card tracks the current time in the browser and updates every minute.
- It derives a day segment with `dayPart(now)` such as `morning`, `afternoon`, `evening`, or `night`.
- In chat mode, user input is augmented with current local time before calling `analyzeMood(...)`.
- The "What matters now?" button calls `focusToday(...)` with a time-aware check-in string.

### 4.3 Focus mode enrichment in the API

When `focusToday()` is called, `useAICopilot()` sends:

- `mode: 'focus'`
- `mood: <time-aware check-in text>`

In `/api/ai-copilot`, focus mode enriches the prompt with more real application data:

- recent goals from Supabase
- recent mood logs from Supabase
- optionally calendar events if a calendar connection exists

The route then builds a practical daily focus prompt and asks the model to return 3 to 5 short bullet points.

This is one of the places where AI is most tightly integrated with actual user data.

## 5. AI Copilot Intelligence card on the dashboard

The intelligence card is `components/AICopilotInsightsCard.tsx`.

It uses `useAIBrain()` from `hooks/useAIBrain.ts`.

### 5.1 What `useAIBrain()` collects

`useAIBrain()` assembles a single `AISnapshot` from multiple app domains:

- tasks
- goals
- mood logs
- body stats
- body workouts
- finance summary and targets
- recent notes
- habits and streaks

This snapshot structure is defined in `lib/aiSnapshot.ts`.

### 5.2 How the snapshot reaches AI

Once enough data is loaded and `auto` is enabled:

- `useAIBrain()` calls `analyzeSnapshot(snapshot)`
- `useAICopilot()` hashes the snapshot to avoid unnecessary duplicate requests
- it POSTs to `/api/ai-copilot` with `mode: 'brain'`

In `brain` mode, `/api/ai-copilot`:

- formats the snapshot into a large text block
- sends it to the Azure inference endpoint
- asks for structured JSON containing:
- `summary`
- `taskSuggestions`
- `goalHighlights`
- `wellnessNote`
- `riskAlerts`
- `hunterRadar`

The API also builds a fallback "hunter radar" locally if the AI output is missing or invalid.

This card is AI-powered, but it is not currently using motivation items or scripture favorites as part of the snapshot payload.

## 6. Motivation on the dashboard

There are two motivation-related systems in the app:

- the dashboard quote widget
- the user-managed motivation board

These are related by theme, but technically they are different.

### 6.1 Dashboard motivation quote card

The dashboard card is `components/MotivationQuoteCard.tsx`.

It uses `useQuotes()` from `hooks/useQuotes.ts`.

Flow:

- On mount, `useQuotes()` calls `fetch('/api/quotes/random')`.
- The API route is `pages/api/quotes/random.ts`.
- That route tries to fetch a random quote from `https://zenquotes.io/api/random`.
- If that external request fails, it returns a random fallback quote from a hardcoded local list.
- The hook stores the result as `{ text, author }`.
- The card renders the quote and exposes a `New Quote` button that calls `refresh()`.

Important AI note:

- This quote flow does not use AI.
- It is a normal API fetch plus local fallback quotes.

### 6.2 Motivation board data

The persistent motivation board uses `hooks/useMotivationBoard.ts`.

That hook:

- loads rows from the Supabase `motivations` table
- exposes `addItem()`
- exposes `removeItem()`
- refreshes after mutations

The full page UI for this lives in `pages/motivation/index.tsx`.

On the dashboard, `useMotivationBoard()` is not used to render the quote card directly. Instead, the dashboard uses it for contextual motivation logic:

- `pages/dashboard.tsx` loads `motivationItems`
- those items are passed into `getRewardMessage(motivationItems)`
- the resulting reward message is passed to `FocusSessionCard`

So motivation data influences dashboard encouragement logic, but it is not being sent into the AI prompt in the current implementation.

### 6.3 Is AI calling motivations?

Not directly.

Current state:

- AI does not fetch from the `motivations` table inside `/api/ai-copilot`.
- `AISnapshot` does not include motivation board items.
- The quote card does not call any AI route.
- Motivation affects user encouragement locally through `getRewardMessage(...)`, not through the AI model.

If someone says "AI is calling motivations," that would not be accurate for the code as it exists now.

## 7. Daily scripture on the dashboard

The dashboard scripture card is `components/ScriptureCard.tsx`.

It uses two sources:

- `useScripture()` for the currently displayed verse
- `useScriptureFavorites()` for the saved favorites preview

### 7.1 Random verse flow

`useScripture()` in `hooks/useScripture.ts` does this:

- On mount, it fetches `https://labs.bible.org/api/?passage=random&type=json`
- It reads the first returned verse
- It constructs a `reference` string
- It stores `{ reference, text }` in local component state
- `refresh()` simply reruns the same fetch

Important AI note:

- This is not an AI workflow.
- The verse is fetched directly from an external scripture endpoint.

### 7.2 Favorite saving flow

Inside `components/ScriptureCard.tsx`, the `Save Favorite` button:

- checks that a verse and reference exist
- inserts `{ verse: verse.text, reference: verse.reference }` into the Supabase `scripture_favorites` table

The same card also reads favorite items via `useScriptureFavorites()` and shows the first few saved entries on the dashboard.

### 7.3 Full scripture page flow

The full scripture page in `pages/scripture/index.tsx` uses a different route for manual searching:

- the user enters a reference
- the page calls `/api/scripture/search?reference=...`
- `pages/api/scripture/search.ts` calls the ESV API using `ESV_API_KEY`
- the result can then be saved to favorites

So there are actually two scripture acquisition paths in the codebase:

- random verse on the dashboard from `labs.bible.org`
- explicit verse search on the scripture page through the internal ESV proxy route

### 7.4 Is AI calling scripture?

No.

Current state:

- the dashboard scripture card does not call any AI endpoint
- `/api/ai-copilot` does not fetch or include scripture favorites
- `AISnapshot` does not include scripture data
- scripture retrieval is plain HTTP fetch plus Supabase favorite storage

So daily scripture is adjacent to AI on the dashboard, but not integrated into the AI context today.

## 8. What the AI is actually integrated with

Across the relevant dashboard and mental-health code, AI is currently integrated with:

- mood reflections via `/api/ai-copilot` in `mood` mode
- time-aware daily prioritization via `/api/ai-copilot` in `focus` mode
- natural-language data capture via `/api/ai-copilot` in `record` mode
- whole-system dashboard intelligence via `/api/ai-copilot` in `brain` mode
- dedicated mental-health coaching via `/api/mental/coach`

The AI currently consumes or enriches:

- mood logs
- goals
- tasks
- calendar events
- body stats
- body workouts
- finance summary and targets
- notes
- habits

The AI does not currently consume:

- motivation board items
- random motivation quotes
- scripture favorites
- daily scripture content

## 9. Practical summary

If you want to explain the system simply:

- The mental health page is AI-assisted in two ways: a dedicated mental coach and a general mood reflection copilot.
- The dashboard AI card is the main interactive assistant and can both interpret natural-language records and generate context-aware advice.
- The AI insights card builds a broader system summary from many app domains.
- The motivation quote card is not AI-generated; it fetches a random quote from an external quote source or local fallback data.
- The daily scripture card is not AI-generated; it fetches a random verse externally and stores favorites in Supabase.
- Motivation and scripture sit beside the AI on the dashboard, but they are not currently passed into AI prompts.

## 10. If you want tighter AI integration later

The cleanest next steps would be:

- add motivation board items into `AISnapshot`
- add scripture favorites or a current verse into `AISnapshot`
- let `/api/ai-copilot` reference motivation and scripture when generating focus suggestions
- optionally create a unified "daily encouragement" route that blends mood, motivation, scripture, and current schedule

That would make it true that AI is actively calling motivation and scripture data, which is not yet the case in the current implementation.
