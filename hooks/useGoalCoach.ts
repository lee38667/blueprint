import { useState } from 'react'
import type { Goal, GoalCoachInsight, Milestone, Subtask } from '../types/models'

export function useGoalCoach() {
  const [data, setData] = useState<GoalCoachInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const evaluate = async (goal: Goal | null, goalMilestones: Milestone[], goalSubtasks: Subtask[]) => {
    if (!goal) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/goals/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, milestones: goalMilestones, subtasks: goalSubtasks })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || 'Unable to evaluate goal progress')
      }
      setData(json as GoalCoachInsight)
    } catch (error: any) {
      setError(error.message || 'Unexpected error')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, evaluate }
}

export default useGoalCoach
