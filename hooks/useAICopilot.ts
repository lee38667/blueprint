import { useState, useCallback } from 'react'
import { AISnapshot } from '../lib/aiSnapshot'

type Mode = 'mood' | 'focus'

export interface BrainInsight {
  summary: string
  taskSuggestions: string[]
  goalHighlights: string[]
  wellnessNote?: string
  riskAlerts?: string[]
}

export function useAICopilot() {
  const [insights, setInsights] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brainInsights, setBrainInsights] = useState<BrainInsight | null>(null)
  const [brainLoading, setBrainLoading] = useState(false)
  const [brainError, setBrainError] = useState<string | null>(null)

  async function requestInsight(mood: string, mode: Mode = 'mood') {
    if (!mood && mode === 'mood') return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, mode })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to fetch AI insight')
      }

      const data = (await res.json()) as { insight: string }
      setInsights(data.insight)
    } catch (e: any) {
      setError(e.message || 'Unexpected error')
      setInsights(null)
    } finally {
      setLoading(false)
    }
  }

  async function analyzeMood(mood: string) {
    return requestInsight(mood, 'mood')
  }

  async function focusToday(mood: string) {
    return requestInsight(mood, 'focus')
  }

  const analyzeSnapshot = useCallback(async (snapshot: AISnapshot) => {
    setBrainLoading(true)
    setBrainError(null)
    try {
      const res = await fetch('/api/ai-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'brain', snapshot })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to fetch AI insight')
      }

      const data = (await res.json()) as { brain?: BrainInsight }
      setBrainInsights(data.brain ?? null)
    } catch (e: any) {
      setBrainError(e.message || 'Unexpected error')
      setBrainInsights(null)
    } finally {
      setBrainLoading(false)
    }
  }, [])

  return {
    insights,
    loading,
    error,
    analyzeMood,
    focusToday,
    brainInsights,
    brainLoading,
    brainError,
    analyzeSnapshot
  }
}

export default useAICopilot

