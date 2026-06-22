# Graph Report - .  (2026-06-22)

## Corpus Check
- 193 files · ~129,153 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 999 nodes · 2184 edges · 58 communities (47 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.78)
- Token cost: 68,974 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Body Map & Gamification UI|Body Map & Gamification UI]]
- [[_COMMUNITY_Calendar & Chat Integration|Calendar & Chat Integration]]
- [[_COMMUNITY_Habits & Test Suite|Habits & Test Suite]]
- [[_COMMUNITY_Error Boundary|Error Boundary]]
- [[_COMMUNITY_Icon Library|Icon Library]]
- [[_COMMUNITY_Dependencies (package.json)|Dependencies (package.json)]]
- [[_COMMUNITY_Layout Primitives|Layout Primitives]]
- [[_COMMUNITY_AI Coach API Routes|AI Coach API Routes]]
- [[_COMMUNITY_Charts & Trends|Charts & Trends]]
- [[_COMMUNITY_Muscle Map|Muscle Map]]
- [[_COMMUNITY_Core UI (ButtonCard)|Core UI (Button/Card)]]
- [[_COMMUNITY_Goals & Data Store Hooks|Goals & Data Store Hooks]]
- [[_COMMUNITY_Daily Briefing & Focus|Daily Briefing & Focus]]
- [[_COMMUNITY_App Constants|App Constants]]
- [[_COMMUNITY_AI Copilot Cards|AI Copilot Cards]]
- [[_COMMUNITY_CalendarDashboard Hooks & Health|Calendar/Dashboard Hooks & Health]]
- [[_COMMUNITY_Body Stats Advice API|Body Stats Advice API]]
- [[_COMMUNITY_Data Hooks (BodyFinanceProfileSkills)|Data Hooks (Body/Finance/Profile/Skills)]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Vercel Config & API Timeouts|Vercel Config & API Timeouts]]
- [[_COMMUNITY_Module 20|Module 20]]
- [[_COMMUNITY_Module 21|Module 21]]
- [[_COMMUNITY_Module 22|Module 22]]
- [[_COMMUNITY_Module 23|Module 23]]
- [[_COMMUNITY_Module 24|Module 24]]
- [[_COMMUNITY_Module 25|Module 25]]
- [[_COMMUNITY_Module 26|Module 26]]
- [[_COMMUNITY_Module 27|Module 27]]
- [[_COMMUNITY_Module 28|Module 28]]
- [[_COMMUNITY_Module 29|Module 29]]
- [[_COMMUNITY_Module 30|Module 30]]
- [[_COMMUNITY_Module 31|Module 31]]
- [[_COMMUNITY_Module 32|Module 32]]
- [[_COMMUNITY_Module 33|Module 33]]
- [[_COMMUNITY_Module 34|Module 34]]
- [[_COMMUNITY_Module 35|Module 35]]
- [[_COMMUNITY_Module 36|Module 36]]
- [[_COMMUNITY_Module 37|Module 37]]
- [[_COMMUNITY_Module 38|Module 38]]
- [[_COMMUNITY_Module 39|Module 39]]
- [[_COMMUNITY_Module 40|Module 40]]
- [[_COMMUNITY_Module 41|Module 41]]
- [[_COMMUNITY_Module 42|Module 42]]
- [[_COMMUNITY_Module 43|Module 43]]
- [[_COMMUNITY_Module 44|Module 44]]
- [[_COMMUNITY_Module 45|Module 45]]
- [[_COMMUNITY_Module 46|Module 46]]
- [[_COMMUNITY_Module 47|Module 47]]
- [[_COMMUNITY_Module 48|Module 48]]
- [[_COMMUNITY_Module 49|Module 49]]
- [[_COMMUNITY_Module 52|Module 52]]
- [[_COMMUNITY_Module 53|Module 53]]
- [[_COMMUNITY_Module 54|Module 54]]
- [[_COMMUNITY_Module 55|Module 55]]

## God Nodes (most connected - your core abstractions)
1. `useToastStore` - 53 edges
2. `authGuard()` - 33 edges
3. `supabase` - 33 edges
4. `useAIBrain()` - 20 edges
5. `handleError()` - 20 edges
6. `Layout()` - 19 edges
7. `CardSkeleton()` - 19 edges
8. `supabaseWithRetry()` - 19 edges
9. `useConfirm()` - 17 edges
10. `useGoals()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `RLS Insert Failure: Missing user_id Default` --semantically_similar_to--> `Chat RLS Policies`  [INFERRED] [semantically similar]
  docs/AUDIT-2026-06.md → CHAT_SETUP.md
- `handler()` --calls--> `authGuard()`  [EXTRACTED]
  pages/api/documents/summarize.ts → lib/apiAuth.ts
- `handler()` --calls--> `authGuard()`  [EXTRACTED]
  pages/api/finance/coach.ts → lib/apiAuth.ts
- `handler()` --calls--> `authGuard()`  [EXTRACTED]
  pages/api/goals/coach.ts → lib/apiAuth.ts
- `handler()` --calls--> `authGuard()`  [EXTRACTED]
  pages/api/goals/plan.ts → lib/apiAuth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **User-Scoped RLS Security Model** — readme_row_level_security, chat_setup_row_level_security, docs_audit_2026_06_userid_default_rls_bug, docs_audit_2026_06_habits_rls_hole [INFERRED 0.85]
- **AI Copilot Multi-Mode Pipeline** — copilot_instructions_ai_copilot_endpoint, docs_dashboard_mental_motivation_scripture_ai_copilot_modes, docs_dashboard_mental_motivation_scripture_ai_snapshot, readme_ai_features [INFERRED 0.85]
- **Design-System Consistency Effort** — docs_ux_audit_design_token_system, docs_ux_audit_metric_card, docs_ux_audit_page_container, docs_ux_audit_accessibility [INFERRED 0.75]

## Communities (58 total, 11 thin omitted)

### Community 0 - "Body Map & Gamification UI"
Cohesion: 0.09
Nodes (47): BodyMapSelectorProps, ZONES, LevelUpModalProps, handler(), generateWithAI(), handler(), CompleteQuestResponse, GenerateQuestResponse (+39 more)

### Community 1 - "Calendar & Chat Integration"
Cohesion: 0.06
Nodes (49): calendar_connections Table, Google Calendar Integration Setup, Google Calendar OAuth Flow, AES Token Encryption, chat_conversations Table, chat_memories Table, chat_messages Table, Chat Persistence & Memory Setup (+41 more)

### Community 2 - "Habits & Test Suite"
Cohesion: 0.07
Nodes (38): h1, h2, habitLogs, habits, kinds, NOW, overdue, report (+30 more)

### Community 3 - "Error Boundary"
Cohesion: 0.06
Nodes (29): ErrorBoundary, Props, State, NavSection, navSections, Sidebar(), ThemeProvider(), toastConfig (+21 more)

### Community 5 - "Dependencies (package.json)"
Cohesion: 0.05
Nodes (43): dependencies, chart.js, class-variance-authority, clsx, crypto-js, framer-motion, fuse.js, googleapis (+35 more)

### Community 6 - "Layout Primitives"
Cohesion: 0.07
Nodes (31): PageContainerProps, PageWidth, widthClass, calculateGoalProgress(), calculateMilestoneProgress(), ProgressBarProps, ProgressRing(), ProgressRingProps (+23 more)

### Community 7 - "AI Coach API Routes"
Cohesion: 0.08
Nodes (30): Data, ErrorPayload, handler(), Success, Data, ErrorPayload, handler(), HistoryPayload (+22 more)

### Community 8 - "Charts & Trends"
Cohesion: 0.11
Nodes (24): ChartComponent(), ChartProps, resolveColor(), TrendIndicator(), TrendIndicatorProps, FinancePage(), useFinance(), useFinanceAdvisor() (+16 more)

### Community 9 - "Muscle Map"
Cohesion: 0.10
Nodes (28): BACK, FRONT, MuscleMapProps, Shape, BLANK_EXERCISE, DAYS, Exercise, ExerciseSet (+20 more)

### Community 10 - "Core UI (Button/Card)"
Cohesion: 0.12
Nodes (16): ButtonProps, CardProps, ConfirmDialogProps, HabitsPage(), ConfirmOptions, ConfirmState, useConfirm(), useLifeArea() (+8 more)

### Community 11 - "Goals & Data Store Hooks"
Cohesion: 0.17
Nodes (23): emptyTotals, DataStore, BodyStat, CoachingTone, ConcernKind, DocumentItem, FinanceHistoryEntry, FinanceLog (+15 more)

### Community 12 - "Daily Briefing & Focus"
Cohesion: 0.11
Nodes (17): Data, ErrorPayload, handler(), Success, Mode, Props, AISnapshot, hashSnapshot() (+9 more)

### Community 13 - "App Constants"
Cohesion: 0.08
Nodes (23): AI_MODES, ANIMATION_DURATION, API_ROUTES, CHART_COLORS, DATE_FORMATS, DEBOUNCE_DELAY, EXPORT_FORMATS, FILE_UPLOAD (+15 more)

### Community 14 - "AI Copilot Cards"
Cohesion: 0.20
Nodes (16): AICopilotInsightsCard(), Props, SectionKey, DailyFocusCard(), clampPercent(), GamificationDashboardCard(), getExpProgress(), Options (+8 more)

### Community 15 - "Calendar/Dashboard Hooks & Health"
Cohesion: 0.14
Nodes (10): Data, CalendarEvent, DashboardData, getAccessToken(), maybeCompleteQuest(), postAuthedJson(), supabase, FormData (+2 more)

### Community 16 - "Body Stats Advice API"
Cohesion: 0.16
Nodes (16): BodyStatPayload, Data, ErrorPayload, handler(), Success, handler(), handler(), ApiError (+8 more)

### Community 17 - "Data Hooks (Body/Finance/Profile/Skills)"
Cohesion: 0.17
Nodes (15): defaultProfilePayload, ProfilePayload, SkillPayload, extractErrorMessage(), handleError(), HandleErrorOptions, ToastLike, withHandledRetry() (+7 more)

### Community 18 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx (+12 more)

### Community 19 - "Vercel Config & API Timeouts"
Cohesion: 0.10
Nodes (20): crons, functions, pages/api/ai-copilot.ts, pages/api/body-stats/advice.ts, pages/api/chat.ts, pages/api/daily-briefing.ts, pages/api/documents/summarize.ts, pages/api/finance/coach.ts (+12 more)

### Community 20 - "Module 20"
Cohesion: 0.18
Nodes (15): isSameDay(), markFired(), Nudge, readFiredKeys(), startOfToday(), SystemPresence(), BASE_ITEMS, SearchItem (+7 more)

### Community 21 - "Module 21"
Cohesion: 0.19
Nodes (17): buildFallbackHunterActions(), buildFallbackHunterRadar(), clamp(), Data, DataAction, handler(), Mode, normalizeHunterRadar() (+9 more)

### Community 22 - "Module 22"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 23 - "Module 23"
Cohesion: 0.20
Nodes (12): AICopilotCard(), dayPart(), formatClock(), AICopilotTester(), AIRecorderCard(), Mode, useAICopilot(), DataAction (+4 more)

### Community 24 - "Module 24"
Cohesion: 0.14
Nodes (9): CoachResponse, Heuristics, Notification, authedFetch(), DailyBriefing, FinanceCategoryTrend, FinanceCoachAdvice, FinanceProjectionPoint (+1 more)

### Community 25 - "Module 25"
Cohesion: 0.21
Nodes (11): CalendarPage(), ContentPage(), DOC_TYPES, SHARE_OPTIONS, useCalendar(), DocumentPayload, useContentLibrary(), Toast (+3 more)

### Community 26 - "Module 26"
Cohesion: 0.17
Nodes (9): CATEGORY_LABELS, ChatPage(), SUGGESTIONS, CalendarAction, CalendarActionResult, ChatMemory, ChatMessage, Conversation (+1 more)

### Community 27 - "Module 27"
Cohesion: 0.17
Nodes (10): CircularCommandMenuProps, CommandItem, Component(), ListSkeleton(), cn(), CircularCommandMenuProps, CommandItem, Component() (+2 more)

### Community 28 - "Module 28"
Cohesion: 0.17
Nodes (9): EmptyStateProps, particles, Props, RewardBurst(), useMotivationBoard(), useProductivityAnalytics(), MotivationPage(), MicroState (+1 more)

### Community 29 - "Module 29"
Cohesion: 0.22
Nodes (11): DailyBriefingCard(), CardSkeleton(), LineSkeleton(), LineSkeletonProps, ListSkeletonProps, Skeleton, SkeletonProps, useDailyBriefing() (+3 more)

### Community 30 - "Module 30"
Cohesion: 0.13
Nodes (11): BodyStatSchema, FinanceLogSchema, FinanceSummarySchema, GoalFormSchema, MoodLogSchema, NoteFormSchema, NotificationSchema, TaskFormSchema (+3 more)

### Community 31 - "Module 31"
Cohesion: 0.25
Nodes (7): Options, useInfiniteList(), decryptText(), encryptText(), INITIAL_FORM, NotesPage(), ReactMarkdown

### Community 32 - "Module 32"
Cohesion: 0.22
Nodes (10): BASE_URL, BROWSER, buildDriver(), { Builder, By, until }, chrome, edge, firefox, record() (+2 more)

### Community 33 - "Module 33"
Cohesion: 0.33
Nodes (7): handler(), supabase, handler(), supabase, secret(), signState(), verifyState()

### Community 34 - "Module 34"
Cohesion: 0.40
Nodes (7): handler(), CalendarEvent, getAuthorizedClient(), oauthClient(), decryptToken(), encryptToken(), getKey()

### Community 35 - "Module 35"
Cohesion: 0.20
Nodes (7): BadgeProps, BadgeSize, BadgeVariant, PRIORITY_META, PriorityBadge(), STATUS_META, TaskStatusBadge()

### Community 36 - "Module 36"
Cohesion: 0.25
Nodes (5): KeyboardShortcutsGuide(), shortcuts, ConfirmDialogProps, Modal(), ModalProps

### Community 37 - "Module 37"
Cohesion: 0.36
Nodes (5): Layout(), LayoutProps, Navbar(), useNotifications(), NotificationsPage()

### Community 38 - "Module 38"
Cohesion: 0.39
Nodes (5): ScriptureCard(), useScripture(), Verse, ScriptureFavorite, useScriptureFavorites()

### Community 39 - "Module 39"
Cohesion: 0.25
Nodes (7): Data, ErrorPayload, GoalPayload, handler(), MilestonePayload, SubtaskPayload, Success

### Community 40 - "Module 40"
Cohesion: 0.25
Nodes (6): ErrorPayload, ExistingGoal, handler(), ProposedGoal, ProposedMilestone, Success

### Community 41 - "Module 41"
Cohesion: 0.60
Nodes (3): MotivationQuoteCard(), Quote, useQuotes()

### Community 42 - "Module 42"
Cohesion: 0.50
Nodes (4): FALLBACK_QUOTES, fetchWithRetry(), handler(), Quote

### Community 43 - "Module 43"
Cohesion: 0.67
Nodes (3): GamificationRadar(), GamificationRadarProps, resolveColor()

## Knowledge Gaps
- **338 isolated node(s):** `supabase`, `$schema`, `style`, `rsc`, `tsx` (+333 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AISnapshot` connect `Daily Briefing & Focus` to `Layout Primitives`, `AI Copilot Cards`, `Module 21`, `Module 23`, `Module 24`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `useToastStore` connect `Module 25` to `Body Map & Gamification UI`, `Error Boundary`, `Module 37`, `Charts & Trends`, `Muscle Map`, `Core UI (Button/Card)`, `Goals & Data Store Hooks`, `AI Copilot Cards`, `Calendar/Dashboard Hooks & Health`, `Data Hooks (Body/Finance/Profile/Skills)`, `Module 20`, `Module 23`, `Module 24`, `Module 28`, `Module 29`, `Module 31`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `authGuard()` connect `Body Stats Advice API` to `Module 34`, `Module 39`, `AI Coach API Routes`, `Module 40`, `Daily Briefing & Focus`, `Module 21`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `supabase`, `$schema`, `style` to the rest of the system?**
  _338 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Body Map & Gamification UI` be split into smaller, more focused modules?**
  _Cohesion score 0.09013914095583787 - nodes in this community are weakly interconnected._
- **Should `Calendar & Chat Integration` be split into smaller, more focused modules?**
  _Cohesion score 0.05612244897959184 - nodes in this community are weakly interconnected._
- **Should `Habits & Test Suite` be split into smaller, more focused modules?**
  _Cohesion score 0.06956521739130435 - nodes in this community are weakly interconnected._