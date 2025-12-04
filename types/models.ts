export interface Task {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'normal' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  project: string | null
  due_date: string | null
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
  created_at?: string | null
  updated_at?: string | null
}
