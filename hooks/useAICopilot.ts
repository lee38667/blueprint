import { useState, useCallback } from 'react'
import { AISnapshot, BrainInsight, hashSnapshot } from '../lib/aiSnapshot'
import { useAIStore } from '../lib/aiStore'

type Mode = 'mood' | 'focus'

export function useAICopilot() {
  const [insights, setInsights] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const brainInsights = useAIStore(state => state.insight)
  const brainLoading = useAIStore(state => state.loading)
  const brainError = useAIStore(state => state.error)
  const setBrainLoadingState = useAIStore(state => state.setLoading)
  const setBrainResult = useAIStore(state => state.setResult)
  const setBrainErrorState = useAIStore(state => state.setError)

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

  const analyzeSnapshot = useCallback(async (snapshot: AISnapshot, options?: { force?: boolean }) => {
    const snapshotHash = hashSnapshot(snapshot)
    const { currentHash, insight } = useAIStore.getState()
    if (!options?.force && currentHash === snapshotHash && insight) return

    setBrainLoadingState(snapshotHash)
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
      if (!data.brain) {
        throw new Error('Brain insight missing from response')
      }
      setBrainResult(snapshotHash, data.brain)
    } catch (e: any) {
      setBrainErrorState(e.message || 'Unexpected error')
    }
  }, [setBrainLoadingState, setBrainResult, setBrainErrorState])

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

