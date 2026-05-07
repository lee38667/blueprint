import { useEffect, useState, useCallback, useRef } from 'react'
import { useAIBrain } from './useAIBrain'
import type { DailyBriefing } from '../types/models'

const CACHE_KEY = 'blueprint-daily-briefing'

function getCachedBriefing(): DailyBriefing | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DailyBriefing
    const cachedDate = new Date(parsed.generatedAt).toISOString().slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)
    if (cachedDate === today) return parsed
    return null
  } catch {
    return null
  }
}

export function useDailyBriefing() {
  const { ready, snapshot } = useAIBrain()
  const [briefing, setBriefing] = useState<DailyBriefing | null>(getCachedBriefing)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchBriefing = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCachedBriefing()
      if (cached) {
        setBriefing(cached)
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/daily-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate briefing')
        return
      }
      setBriefing(data)
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch (err: any) {
      setError(err.message || 'Failed to fetch briefing')
    } finally {
      setLoading(false)
    }
  }, [snapshot])

  useEffect(() => {
    if (fetchedRef.current) return
    if (!ready) return

    const cached = getCachedBriefing()
    if (cached) {
      setBriefing(cached)
      return
    }

    const hasData = Boolean(
      snapshot.tasks.length ||
      snapshot.goals.length ||
      snapshot.moods.length ||
      snapshot.bodyStats.length
    )
    if (!hasData) return

    fetchedRef.current = true
    fetchBriefing()
  }, [ready, snapshot, fetchBriefing])

  return {
    briefing,
    loading,
    error,
    refresh: () => fetchBriefing(true)
  }
}

export default useDailyBriefing
