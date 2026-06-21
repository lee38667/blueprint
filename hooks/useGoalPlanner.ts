import { useState } from 'react'
import type { Goal, GoalPlan } from '../types/models'
import { authedFetch } from '../lib/apiClient'

export function useGoalPlanner() {
  const [plan, setPlan] = useState<GoalPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async (intent: string, existingGoals: Goal[], context = '') => {
    setLoading(true)
    setError(null)
    try {
      const res = await authedFetch('/api/goals/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          context,
          existingGoals: existingGoals.map((g) => ({
            title: g.title,
            status: g.status,
            category: g.category,
            target_date: g.target_date,
          })),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Unable to plan goals')
      setPlan(json as GoalPlan)
    } catch (err: any) {
      setError(err.message || 'Unexpected error')
      setPlan(null)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => setPlan(null)

  return { plan, loading, error, generate, reset }
}

export default useGoalPlanner
