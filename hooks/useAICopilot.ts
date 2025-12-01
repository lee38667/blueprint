import { useState } from 'react'

export function useAICopilot(){
  const [insights, setInsights] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyzeMood(mood: string){
    if (!mood) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood })
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

  return { insights, loading, error, analyzeMood }
}

export default useAICopilot

