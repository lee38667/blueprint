import { create } from 'zustand'
import { supabase } from './supabaseClient'
import type {
  Task,
  Goal,
  Milestone,
  Subtask,
  FinanceSummary,
  FinanceHistoryEntry,
  FinanceLog,
  SavingsTarget,
  MoodLog,
  BodyStat,
  NoteEntry,
  DocumentItem
} from '../types/models'

// Centralized cache for Supabase-backed modules.
// To onboard a new table/module, add its slice here so every hook/component
// can share the same fetch results and avoid duplicate queries.

interface DataStore {
  tasks: Task[]
  tasksLoading: boolean
  tasksLoaded: boolean
  fetchTasks: () => Promise<void>

  goals: Goal[]
  milestones: Milestone[]
  subtasks: Subtask[]
  goalsLoading: boolean
  goalsLoaded: boolean
  fetchGoalsBundle: () => Promise<void>

  financeSummary: FinanceSummary | null
  financeHistory: FinanceHistoryEntry[]
  financeLogs: FinanceLog[]
  savingsTargets: SavingsTarget[]
  financeLoading: boolean
  financeLoaded: boolean
  fetchFinance: () => Promise<void>

  moodLogs: MoodLog[]
  moodLoading: boolean
  moodLoaded: boolean
  fetchMoodLogs: () => Promise<void>

  bodyStats: BodyStat[]
  bodyLoading: boolean
  bodyLoaded: boolean
  fetchBodyStats: () => Promise<void>

  notes: NoteEntry[]
  notesLoading: boolean
  notesLoaded: boolean
  fetchNotes: () => Promise<void>

  documents: DocumentItem[]
  documentsLoading: boolean
  documentsLoaded: boolean
  fetchDocuments: () => Promise<void>
}

export const useDataStore = create<DataStore>((set, get) => ({
  tasks: [],
  tasksLoading: false,
  tasksLoaded: false,
  fetchTasks: async () => {
    if (get().tasksLoading) return
    set({ tasksLoading: true })
    const { data } = await supabase
      .from('tasks')
      .select('id,title,description,priority,status,project,due_date,created_at')
      .order('created_at', { ascending: false })
    set({ tasks: (data ?? []) as Task[], tasksLoading: false, tasksLoaded: true })
  },

  goals: [],
  milestones: [],
  subtasks: [],
  goalsLoading: false,
  goalsLoaded: false,
  fetchGoalsBundle: async () => {
    if (get().goalsLoading) return
    set({ goalsLoading: true })
    const [goalsRes, msRes, stRes] = await Promise.all([
      supabase.from('goals').select('id,title,category,target_date,status,progress_note').order('created_at', { ascending: false }),
      supabase.from('goals_milestones').select('id,goal_id,title,due_date,status,created_at').order('created_at', { ascending: false }),
      supabase.from('goals_subtasks').select('id,milestone_id,title,status,created_at').order('created_at', { ascending: false })
    ])
    set({
      goals: (goalsRes.data ?? []) as Goal[],
      milestones: (msRes.data ?? []) as Milestone[],
      subtasks: (stRes.data ?? []) as Subtask[],
      goalsLoading: false,
      goalsLoaded: true
    })
  },

  financeSummary: null,
  financeHistory: [],
  financeLogs: [],
  savingsTargets: [],
  financeLoading: false,
  financeLoaded: false,
  fetchFinance: async () => {
    if (get().financeLoading) return
    set({ financeLoading: true })
    const [summaryRes, historyRes, logsRes, targetsRes] = await Promise.all([
      supabase.from('finance_summary').select('*').maybeSingle(),
      supabase.from('finance_history').select('recorded_at,balance,delta,note').order('recorded_at'),
      supabase.from('finance_logs').select('id,recorded_at,type,amount,category,note').order('recorded_at', { ascending: false }),
      supabase.from('savings_targets').select('id,month,target_amount').order('month')
    ])
    set({
      financeSummary: (summaryRes.data ?? null) as FinanceSummary | null,
      financeHistory: (historyRes.data ?? []) as FinanceHistoryEntry[],
      financeLogs: (logsRes.data ?? []) as FinanceLog[],
      savingsTargets: (targetsRes.data ?? []) as SavingsTarget[],
      financeLoading: false,
      financeLoaded: true
    })
  },

  moodLogs: [],
  moodLoading: false,
  moodLoaded: false,
  fetchMoodLogs: async () => {
    if (get().moodLoading) return
    set({ moodLoading: true })
    const { data } = await supabase
      .from('mood_logs')
      .select('id,mood_label,mood_score,stress_score,note,created_at')
      .order('created_at', { ascending: true })
    set({ moodLogs: (data ?? []) as MoodLog[], moodLoading: false, moodLoaded: true })
  },

  bodyStats: [],
  bodyLoading: false,
  bodyLoaded: false,
  fetchBodyStats: async () => {
    if (get().bodyLoading) return
    set({ bodyLoading: true })
    const { data } = await supabase
      .from('body_stats')
      .select('id,recorded_at,weight,sleep_hours,water_ml,stress')
      .order('recorded_at')
    set({ bodyStats: (data ?? []) as BodyStat[], bodyLoading: false, bodyLoaded: true })
  },

  notes: [],
  notesLoading: false,
  notesLoaded: false,
  fetchNotes: async () => {
    if (get().notesLoading) return
    set({ notesLoading: true })
    const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false })
    set({ notes: (data ?? []) as NoteEntry[], notesLoading: false, notesLoaded: true })
  },

  documents: [],
  documentsLoading: false,
  documentsLoaded: false,
  fetchDocuments: async () => {
    if (get().documentsLoading) return
    set({ documentsLoading: true })
    const { data } = await supabase
      .from('content')
      .select('id,title,type,metadata,created_at')
      .order('created_at', { ascending: false })
    set({ documents: (data ?? []) as DocumentItem[], documentsLoading: false, documentsLoaded: true })
  }
}))
