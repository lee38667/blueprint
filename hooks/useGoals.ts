import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'
import type { Goal, Milestone, Subtask, ProposedGoal } from '../types/models'
import { useCallback } from 'react'

export function useGoals() {
  const goals = useDataStore(s => s.goals)
  const milestones = useDataStore(s => s.milestones)
  const subtasks = useDataStore(s => s.subtasks)
  const tasks = useDataStore(s => s.tasks)
  const loading = useDataStore(s => s.goalsLoading)
  const loaded = useDataStore(s => s.goalsLoaded)
  const fetchGoalsBundle = useDataStore(s => s.fetchGoalsBundle)
  const toast = useToastStore()
  const [error, setError] = useState<string | null>(null)

  const getLinkedTaskProgress = useCallback((goalId: string) => {
    const linked = tasks.filter(t => t.goal_id === goalId)
    const completed = linked.filter(t => t.status === 'done').length
    return {
      total: linked.length,
      completed,
      percentage: linked.length > 0 ? Math.round((completed / linked.length) * 100) : 0,
      tasks: linked
    }
  }, [tasks])

  useEffect(() => {
    if (!loaded) fetchGoalsBundle()
  }, [loaded, fetchGoalsBundle])

  const addGoal = async (payload: Partial<Goal>) => {
    try {
      setError(null)
      const { data: auth } = await supabase.auth.getUser()
      await supabaseWithRetry(() => supabase.from('goals').insert({
        user_id: auth.user?.id,
        title: payload.title,
        category: payload.category,
        target_date: payload.target_date,
        status: payload.status ?? 'active',
        progress_note: payload.progress_note
      }))
      await fetchGoalsBundle()
      toast.success('Goal added')
    } catch (err) {
      handleError(err, { fallback: 'Failed to add goal', setError, toast })
    }
  }

  // Create an AI-proposed goal together with its milestones in one action.
  const addPlannedGoal = async (proposed: ProposedGoal) => {
    try {
      setError(null)
      const { data: auth } = await supabase.auth.getUser()
      const { data, error: insertErr } = await supabase
        .from('goals')
        .insert({
          user_id: auth.user?.id,
          title: proposed.title,
          category: proposed.category,
          target_date: proposed.target_date,
          status: 'active',
        })
        .select()
        .single()
      if (insertErr) throw insertErr
      const goalId = data?.id
      if (goalId && proposed.milestones?.length) {
        const rows = proposed.milestones
          .filter((m) => m.title)
          .map((m) => ({ goal_id: goalId, title: m.title, due_date: m.due_date ?? null, status: 'pending' }))
        if (rows.length) {
          await supabaseWithRetry(() => supabase.from('goals_milestones').insert(rows))
        }
      }
      await fetchGoalsBundle()
      toast.success('AI goal added')
    } catch (err) {
      handleError(err, { fallback: 'Failed to add planned goal', setError, toast })
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('goals').update({ status }).eq('id', id))
      await fetchGoalsBundle()
      toast.success('Goal updated')
    } catch (err) {
      handleError(err, { fallback: 'Failed to update goal', setError, toast })
    }
  }

  const addMilestone = async (goal_id: string, payload: Partial<Milestone>) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('goals_milestones').insert({
        goal_id,
        title: payload.title,
        due_date: payload.due_date ?? null,
        status: payload.status ?? 'pending'
      }))
      await fetchGoalsBundle()
      toast.success('Milestone added')
    } catch (err) {
      handleError(err, { fallback: 'Failed to add milestone', setError, toast })
    }
  }

  const updateMilestone = async (id: string, patch: Partial<Milestone>) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('goals_milestones').update(patch).eq('id', id))
      await fetchGoalsBundle()
      toast.success('Milestone updated')
    } catch (err) {
      handleError(err, { fallback: 'Failed to update milestone', setError, toast })
    }
  }

  const addSubtask = async (milestone_id: string, payload: Partial<Subtask>) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('goals_subtasks').insert({
        milestone_id,
        title: payload.title,
        status: payload.status ?? 'todo'
      }))
      await fetchGoalsBundle()
      toast.success('Subtask added')
    } catch (err) {
      handleError(err, { fallback: 'Failed to add subtask', setError, toast })
    }
  }

  const updateSubtask = async (id: string, patch: Partial<Subtask>) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('goals_subtasks').update(patch).eq('id', id))
      await fetchGoalsBundle()
      toast.success('Subtask updated')
    } catch (err) {
      handleError(err, { fallback: 'Failed to update subtask', setError, toast })
    }
  }

  return { goals, milestones, subtasks, loading, error, addGoal, addPlannedGoal, updateStatus, addMilestone, updateMilestone, addSubtask, updateSubtask, getLinkedTaskProgress }
}

export default useGoals
