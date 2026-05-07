export interface Task {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'normal' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  project: string | null
  due_date: string | null
  goal_id: string | null
  created_at: string
}

export interface Goal {
  id: string
  title: string
  category: string | null
  target_date: string | null
  status: string
  progress_note: string | null
}

export interface Milestone {
  id: string
  goal_id: string
  title: string
  due_date: string | null
  status: string
  created_at: string
}

export interface Subtask {
  id: string
  milestone_id: string
  title: string
  status: string
  created_at: string
}

export interface FinanceLog {
  id: string
  recorded_at: string
  type: 'income' | 'expense'
  amount: number
  category: string | null
  note: string | null
}

export interface SavingsTarget {
  id: string
  month: string
  target_amount: number
}

export interface FinanceSummary {
  id?: string
  balance: number | null
  savings: number | null
  debt?: number | null
  updated_at?: string
}

export interface FinanceHistoryEntry {
  id?: string
  recorded_at: string
  balance: number
  delta: number | null
  note: string | null
}

export interface MoodLog {
  id: string
  mood_label: string | null
  mood_score: number | null
  stress_score: number | null
  note: string | null
  created_at: string
}

export interface BodyStat {
  id: string
  recorded_at: string
  weight: number | null
  sleep_hours: number | null
  water_ml: number | null
  stress: number | null
}

export interface NoteEntry {
  id: string
  title?: string | null
  content?: string | null
  heading?: string | null
  body?: string | null
  tags?: string[] | null
  attachments?: Record<string, any> | null
  created_at?: string | null
  updated_at?: string | null
}

export interface DocumentItem {
  id: string
  title: string | null
  type: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface MoodCoachInsight {
  encouragement: string
  burnoutRisk: 'low' | 'medium' | 'high'
  actions: string[]
  regulationTips: string[]
}

export interface ProductivityAnalytics {
  completionRate: number
  overdueCount: number
  activeCount: number
  weeklyLabels: string[]
  weeklyVelocity: number[]
  priorityTotals: Record<'low' | 'normal' | 'high', number>
  focusProjects: { name: string; count: number }[]
}

export interface GoalCoachInsight {
  goalId: string
  momentumScore: number
  summary: string
  risks: string[]
  nextSteps: string[]
}

export interface FinanceProjectionPoint {
  label: string
  value: number
}

export interface FinanceCategoryTrend {
  category: string
  income: number
  expense: number
}

export interface FinanceCoachAdvice {
  outlook: string
  guardrails: string[]
  opportunities: string[]
  cashflowScore: number
}

export interface Habit {
  id: string
  name: string
  frequency: 'daily' | 'weekly'
  created_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  logged_at: string
  completed: boolean
}

export interface DailyBriefing {
  greeting: string
  priorityTasks: Array<{ title: string; priority: string; dueInfo?: string }>
  overdueAlerts: string[]
  moodTrend: string
  financialNote: string
  focusRecommendation: string
  generatedAt: string
}

export type QuestType = 'task' | 'habit' | 'workout' | 'body_part'

export type QuestStatus = 'pending' | 'completed' | 'failed'

export type BodyPart = 'head' | 'arms' | 'chest' | 'abs' | 'legs' | 'back'

export interface GamificationProfile {
  id: string
  user_id: string
  level: number
  exp: number
  gold: number
  class: string
  unlocked_areas: BodyPart[]
  created_at: string
  updated_at: string
}

export interface Quest {
  id: string
  user_id: string
  name: string
  type: QuestType
  description: string
  exp_reward: number
  gold_reward: number
  status: QuestStatus
  linked_entity_id: string | null
  body_part: BodyPart | null
  quest_date: string
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  user_id: string
  name: string
  level: number
  description: string | null
  kind?: string | null
  created_at?: string
}

export type CoachingTone = 'direct' | 'gentle' | 'analytical' | 'encouraging'

export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  timezone: string
  preferred_currency: string
  weekly_planning_day: string
  life_season: string | null
  primary_roles: string[]
  core_values: string[]
  coaching_tone: CoachingTone
  focus_statement: string | null
  default_dashboard_zones: string[]
  created_at: string
  updated_at: string
}

export interface BodyWorkout {
  id: string
  user_id: string
  profile_id: string | null
  body_part: BodyPart
  reps: number | null
  sets: number | null
  notes: string | null
  logged_at: string
}
