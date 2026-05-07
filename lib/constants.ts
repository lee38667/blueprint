/**
 * Application Constants
 * Centralized constants to avoid magic strings and numbers throughout the codebase
 */

// ============================================
// PAGINATION
// ============================================
export const PAGINATION = {
  NOTES_PAGE_SIZE: 20,
  TASKS_PAGE_SIZE: 20,
  FINANCE_LOGS_PAGE_SIZE: 50,
  GOALS_PAGE_SIZE: 15,
  MOTIVATIONS_PAGE_SIZE: 12,
  CONTENT_PAGE_SIZE: 24,
} as const;

// ============================================
// API ENDPOINTS
// ============================================
export const API_ROUTES = {
  AI_COPILOT: '/api/ai-copilot',
  GOALS_COACH: '/api/goals/coach',
  FINANCE_COACH: '/api/finance/coach',
  MENTAL_COACH: '/api/mental/coach',
  BODY_STATS_ADVICE: '/api/body-stats/advice',
  NOTES_ANALYZE: '/api/notes/analyze',
  DOCUMENTS_SUMMARIZE: '/api/documents/summarize',
  SCRIPTURE_SEARCH: '/api/scripture/search',
  CALENDAR_AUTH: '/api/calendar/auth',
  CALENDAR_EVENTS: '/api/calendar/events',
  CALENDAR_DISCONNECT: '/api/calendar/disconnect',
} as const;

// ============================================
// TASK STATUSES
// ============================================
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const;

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.TODO]: 'To Do',
  [TASK_STATUS.IN_PROGRESS]: 'In Progress',
  [TASK_STATUS.DONE]: 'Done',
} as const;

// ============================================
// TASK PRIORITIES
// ============================================
export const TASK_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
} as const;

export const TASK_PRIORITY_LABELS = {
  [TASK_PRIORITY.LOW]: 'Low',
  [TASK_PRIORITY.NORMAL]: 'Normal',
  [TASK_PRIORITY.HIGH]: 'High',
} as const;

export const TASK_PRIORITY_COLORS = {
  [TASK_PRIORITY.LOW]: 'teal',
  [TASK_PRIORITY.NORMAL]: 'electric',
  [TASK_PRIORITY.HIGH]: 'red-400',
} as const;

// ============================================
// GOAL STATUSES
// ============================================
export const GOAL_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
} as const;

export const GOAL_STATUS_LABELS = {
  [GOAL_STATUS.PLANNING]: 'Planning',
  [GOAL_STATUS.ACTIVE]: 'Active',
  [GOAL_STATUS.ON_HOLD]: 'On Hold',
  [GOAL_STATUS.COMPLETED]: 'Completed',
  [GOAL_STATUS.ABANDONED]: 'Abandoned',
} as const;

// ============================================
// FINANCE CATEGORIES
// ============================================
export const FINANCE_CATEGORIES = [
  'income',
  'housing',
  'transportation',
  'food',
  'utilities',
  'healthcare',
  'insurance',
  'savings',
  'debt',
  'entertainment',
  'personal',
  'education',
  'gifts',
  'other',
] as const;

export const FINANCE_CATEGORY_LABELS: Record<typeof FINANCE_CATEGORIES[number], string> = {
  income: 'Income',
  housing: 'Housing',
  transportation: 'Transportation',
  food: 'Food & Dining',
  utilities: 'Utilities',
  healthcare: 'Healthcare',
  insurance: 'Insurance',
  savings: 'Savings & Investments',
  debt: 'Debt Payments',
  entertainment: 'Entertainment',
  personal: 'Personal Care',
  education: 'Education',
  gifts: 'Gifts & Donations',
  other: 'Other',
};

// ============================================
// MOOD OPTIONS
// ============================================
export const MOOD_OPTIONS = [
  { value: 'excellent', label: 'Excellent', emoji: '😄' },
  { value: 'good', label: 'Good', emoji: '😊' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'low', label: 'Low', emoji: '😔' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
] as const;

// ============================================
// AI MODES
// ============================================
export const AI_MODES = {
  MOOD: 'mood',
  FOCUS: 'focus',
  BRAIN: 'brain',
  RECORD: 'record',
} as const;

// ============================================
// DATE FORMATS
// ============================================
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm',
} as const;

// ============================================
// CHART COLORS
// ============================================
export const CHART_COLORS = {
  ELECTRIC: '#00E5FF',
  NEON: '#B300FF',
  TEAL: '#00FFCC',
  RED: '#FF4444',
  YELLOW: '#FFD700',
  GREEN: '#00FF88',
} as const;

// ============================================
// STORAGE KEYS
// ============================================
export const STORAGE_KEYS = {
  THEME: 'blueprint_theme',
  ACCENT_COLOR: 'blueprint_accent_color',
  SIDEBAR_COLLAPSED: 'blueprint_sidebar_collapsed',
  DARK_MODE: 'blueprint_dark_mode',
} as const;

// ============================================
// VALIDATION
// ============================================
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NOTE_LENGTH: 10000,
  MAX_TASK_TITLE_LENGTH: 200,
  MAX_GOAL_TITLE_LENGTH: 200,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS_PER_NOTE: 10,
} as const;

// ============================================
// TOAST DURATIONS (milliseconds)
// ============================================
export const TOAST_DURATION = {
  SHORT: 2000,
  DEFAULT: 3000,
  LONG: 5000,
} as const;

// ============================================
// ANIMATION DURATIONS (milliseconds)
// ============================================
export const ANIMATION_DURATION = {
  FAST: 150,
  DEFAULT: 300,
  SLOW: 500,
} as const;

// ============================================
// DEBOUNCE DELAYS (milliseconds)
// ============================================
export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  AUTO_SAVE: 1000,
  RESIZE: 150,
} as const;

// ============================================
// SESSION TIMEOUT (milliseconds)
// ============================================
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// ============================================
// RETRY CONFIG
// ============================================
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000,
  BACKOFF_MULTIPLIER: 2,
} as const;

// ============================================
// FILE UPLOAD LIMITS
// ============================================
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
  ],
} as const;

// ============================================
// EXPORT FORMATS
// ============================================
export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  MARKDOWN: 'markdown',
} as const;
