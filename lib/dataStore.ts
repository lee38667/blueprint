import { create } from 'zustand'
import { supabase } from './supabaseClient'
import { supabaseWithRetry } from './retry'
import { handleError } from './errors'
import { useToastStore } from './toastStore'
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
  DocumentItem,
  Habit,
  HabitLog
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

  habits: Habit[]
  habitLogs: HabitLog[]
  habitsLoading: boolean
  habitsLoaded: boolean
  fetchHabits: () => Promise<void>
}

export const useDataStore = create<DataStore>()((set, get) => ({
  tasks: [],
  tasksLoading: false,
  tasksLoaded: false,
  fetchTasks: async () => {
    if (get().tasksLoading) return
    set({ tasksLoading: true })
    const toast = useToastStore.getState()
    try {
      const { data } = await supabaseWithRetry(() =>
        supabase
          .from('tasks')
          .select('id,title,description,priority,status,project,due_date,goal_id,created_at,updated_at')
          .order('created_at', { ascending: false })
      )

      set({ tasks: (data ?? []) as Task[], tasksLoading: false, tasksLoaded: true })
    } catch (error) {
      handleError(error, { toast, context: 'fetchTasks' })
      set({ tasksLoading: false, tasksLoaded: false })
    }
  },

  goals: [],
  milestones: [],
  subtasks: [],
  goalsLoading: false,
  goalsLoaded: false,
  fetchGoalsBundle: async () => {
    if (get().goalsLoading) return
    set({ goalsLoading: true })
    const toast = useToastStore.getState()
    try {
      const [goalsRes, msRes, stRes] = await Promise.all([
        supabaseWithRetry(() => supabase.from('goals').select('id,title,category,target_date,status,progress_note').order('created_at', { ascending: false })),
        supabaseWithRetry(() => supabase.from('goals_milestones').select('id,goal_id,title,due_date,status,created_at').order('created_at', { ascending: false })),
        supabaseWithRetry(() => supabase.from('goals_subtasks').select('id,milestone_id,title,status,created_at').order('created_at', { ascending: false }))
      ])
      set({
        goals: (goalsRes.data ?? []) as Goal[],
        milestones: (msRes.data ?? []) as Milestone[],
        subtasks: (stRes.data ?? []) as Subtask[],
        goalsLoading: false,
        goalsLoaded: true
      })
    } catch (error) {
      handleError(error, { toast, context: 'fetchGoalsBundle' })
      set({ goalsLoading: false, goalsLoaded: false })
    }
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
    const toast = useToastStore.getState()
    try {
      const [summaryRes, historyRes, logsRes, targetsRes] = await Promise.all([
        supabaseWithRetry(() => supabase.from('finance_summary').select('*').maybeSingle()),
        supabaseWithRetry(() => supabase.from('finance_history').select('recorded_at,balance,delta,note').order('recorded_at')),
        supabaseWithRetry(() => supabase.from('finance_logs').select('id,recorded_at,type,amount,category,note').order('recorded_at', { ascending: false })),
        supabaseWithRetry(() => supabase.from('savings_targets').select('id,month,target_amount').order('month'))
      ])
      set({
        financeSummary: (summaryRes.data ?? null) as FinanceSummary | null,
        financeHistory: (historyRes.data ?? []) as FinanceHistoryEntry[],
        financeLogs: (logsRes.data ?? []) as FinanceLog[],
        savingsTargets: (targetsRes.data ?? []) as SavingsTarget[],
        financeLoading: false,
        financeLoaded: true
      })
    } catch (error) {
      handleError(error, { toast, context: 'fetchFinance' })
      set({ financeLoading: false, financeLoaded: false })
    }
  },

  moodLogs: [],
  moodLoading: false,
  moodLoaded: false,
  fetchMoodLogs: async () => {
    if (get().moodLoading) return
    set({ moodLoading: true })
    const toast = useToastStore.getState()
    try {
      const { data } = await supabaseWithRetry(() =>
        supabase
          .from('mood_logs')
          .select('id,mood_label,mood_score,stress_score,note,created_at')
          .order('created_at', { ascending: true })
      )
      set({ moodLogs: (data ?? []) as MoodLog[], moodLoading: false, moodLoaded: true })
    } catch (error) {
      handleError(error, { toast, context: 'fetchMoodLogs' })
      set({ moodLoading: false, moodLoaded: false })
    }
  },

  bodyStats: [],
  bodyLoading: false,
  bodyLoaded: false,
  fetchBodyStats: async () => {
    if (get().bodyLoading) return
    set({ bodyLoading: true })
    const toast = useToastStore.getState()
    try {
      const { data } = await supabaseWithRetry(() =>
        supabase
          .from('body_stats')
          .select('id,recorded_at,weight,sleep_hours,water_ml,stress')
          .order('recorded_at')
      )
      set({ bodyStats: (data ?? []) as BodyStat[], bodyLoading: false, bodyLoaded: true })
    } catch (error) {
      handleError(error, { toast, context: 'fetchBodyStats' })
      set({ bodyLoading: false, bodyLoaded: false })
    }
  },

  notes: [],
  notesLoading: false,
  notesLoaded: false,
  fetchNotes: async () => {
    if (get().notesLoading) return
    set({ notesLoading: true })
    const toast = useToastStore.getState()
    try {
      const { data } = await supabaseWithRetry(() =>
        supabase.from('notes').select('*').order('updated_at', { ascending: false })
      )
      set({ notes: (data ?? []) as NoteEntry[], notesLoading: false, notesLoaded: true })
    } catch (error) {
      handleError(error, { toast, context: 'fetchNotes' })
      set({ notesLoading: false, notesLoaded: false })
    }
  },

  documents: [],
  documentsLoading: false,
  documentsLoaded: false,
  fetchDocuments: async () => {
    if (get().documentsLoading) return
    set({ documentsLoading: true })
    const toast = useToastStore.getState()
    try {
      const { data } = await supabaseWithRetry(() =>
        supabase
          .from('content')
          .select('id,title,type,metadata,created_at')
          .order('created_at', { ascending: false })
      )
      set({ documents: (data ?? []) as DocumentItem[], documentsLoading: false, documentsLoaded: true })
    } catch (error) {
      handleError(error, { toast, context: 'fetchDocuments' })
      set({ documentsLoading: false, documentsLoaded: false })
    }
  },

  habits: [],
  habitLogs: [],
  habitsLoading: false,
  habitsLoaded: false,
  fetchHabits: async () => {
    if (get().habitsLoading) return
    set({ habitsLoading: true })
    const toast = useToastStore.getState()
    try {
      const [habitsRes, logsRes] = await Promise.all([
        supabaseWithRetry(() =>
          supabase.from('habits').select('id,name,frequency,created_at').order('created_at', { ascending: false })
        ),
        supabaseWithRetry(() =>
          supabase.from('habit_logs').select('id,habit_id,logged_at,completed').order('logged_at', { ascending: false })
        )
      ])
      set({
        habits: (habitsRes.data ?? []) as Habit[],
        habitLogs: (logsRes.data ?? []) as HabitLog[],
        habitsLoading: false,
        habitsLoaded: true
      })
    } catch (error) {
      handleError(error, { toast, context: 'fetchHabits' })
      set({ habitsLoading: false, habitsLoaded: false })
    }
  }
}))
