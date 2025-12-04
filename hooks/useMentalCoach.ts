import { useEffect, useMemo, useState } from 'react'
import type { MoodCoachInsight, MoodLog } from '../types/models'

type Heuristics = {
  avgMood: number | null
  avgStress: number | null
  negativeStreak: number
  burnoutLikely: boolean
}

export function useMentalCoach(logs: MoodLog[]) {
  const [data, setData] = useState<MoodCoachInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recent = useMemo(() => logs.slice(-7), [logs])

  const heuristics = useMemo<Heuristics>(() => {
    if (!recent.length) {
      return { avgMood: null, avgStress: null, negativeStreak: 0, burnoutLikely: false }
    }
    const moodValues = recent.map((l) => l.mood_score).filter((v): v is number => typeof v === 'number')
    const stressValues = recent.map((l) => l.stress_score).filter((v): v is number => typeof v === 'number')
    const avgMood = moodValues.length ? Number((moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1)) : null
    const avgStress = stressValues.length ? Number((stressValues.reduce((a, b) => a + b, 0) / stressValues.length).toFixed(1)) : null

    let negativeStreak = 0
    for (let i = recent.length - 1; i >= 0; i -= 1) {
      const entry = recent[i]
      if ((entry.mood_score ?? 10) <= 3 || (entry.stress_score ?? 0) >= 7) {
        negativeStreak += 1
      } else {
        break
      }
    }

    const burnoutLikely = (avgStress ?? 0) >= 7 && (avgMood ?? 10) <= 4

    return { avgMood, avgStress, negativeStreak, burnoutLikely }
  }, [recent])

  const signature = useMemo(() => {
    return recent.map((l) => `${l.created_at}-${l.mood_score ?? 'x'}-${l.stress_score ?? 'x'}-${l.mood_label ?? 'x'}`).join('|')
  }, [recent])

  useEffect(() => {
    let active = true
    async function run() {
      if (!recent.length) {
        setData(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/mental/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: recent })
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(json.error || 'Unable to fetch encouragement')
        }
        if (!active) return
        setData(json as MoodCoachInsight)
      } catch (error: any) {
        if (!active) return
        setError(error.message || 'Unexpected error')
        setData(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    run()
    return () => {
      active = false
    }
  }, [recent, signature])

  return { data, heuristics, loading, error }
}

export default useMentalCoach
