import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'
import type { Goal, Milestone, Subtask } from '../types/models'
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
      await supabaseWithRetry(() => supabase.from('goals').insert({
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

  return { goals, milestones, subtasks, loading, error, addGoal, updateStatus, addMilestone, updateMilestone, addSubtask, updateSubtask, getLinkedTaskProgress }
}

export default useGoals
