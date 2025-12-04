import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
import type { Goal, Milestone, Subtask } from '../types/models'

export function useGoals() {
  const goals = useDataStore(s => s.goals)
  const milestones = useDataStore(s => s.milestones)
  const subtasks = useDataStore(s => s.subtasks)
  const loading = useDataStore(s => s.goalsLoading)
  const loaded = useDataStore(s => s.goalsLoaded)
  const fetchGoalsBundle = useDataStore(s => s.fetchGoalsBundle)

  useEffect(() => {
    if (!loaded) fetchGoalsBundle()
  }, [loaded, fetchGoalsBundle])

  const addGoal = async (payload: Partial<Goal>) => {
    await supabase.from('goals').insert({
      title: payload.title,
      category: payload.category,
      target_date: payload.target_date,
      status: payload.status ?? 'active',
      progress_note: payload.progress_note
    })
    await fetchGoalsBundle()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('goals').update({ status }).eq('id', id)
    await fetchGoalsBundle()
  }

  const addMilestone = async (goal_id: string, payload: Partial<Milestone>) => {
    await supabase.from('goals_milestones').insert({
      goal_id,
      title: payload.title,
      due_date: payload.due_date ?? null,
      status: payload.status ?? 'pending'
    })
    await fetchGoalsBundle()
  }

  const updateMilestone = async (id: string, patch: Partial<Milestone>) => {
    await supabase.from('goals_milestones').update(patch).eq('id', id)
    await fetchGoalsBundle()
  }

  const addSubtask = async (milestone_id: string, payload: Partial<Subtask>) => {
    await supabase.from('goals_subtasks').insert({
      milestone_id,
      title: payload.title,
      status: payload.status ?? 'todo'
    })
    await fetchGoalsBundle()
  }

  const updateSubtask = async (id: string, patch: Partial<Subtask>) => {
    await supabase.from('goals_subtasks').update(patch).eq('id', id)
    await fetchGoalsBundle()
  }

  return { goals, milestones, subtasks, loading, addGoal, updateStatus, addMilestone, updateMilestone, addSubtask, updateSubtask }
}

export default useGoals
