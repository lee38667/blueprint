import { useState } from 'react'

type Mode = 'mood' | 'focus'

export function useAICopilot() {
  const [insights, setInsights] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return { insights, loading, error, analyzeMood, focusToday }
}

export default useAICopilot

