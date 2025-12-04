import { useEffect, useMemo, useState } from 'react'
import type { BodyStat } from '../types/models'

interface CoachResponse {
  headline: string
  insights: string[]
}

export function useBodyStatsCoach(stats: BodyStat[]) {
  const [data, setData] = useState<CoachResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signature = useMemo(() => {
    return stats
      .slice(-7)
      .map((s) => `${s.recorded_at}-${s.weight ?? 'x'}-${s.sleep_hours ?? 'x'}-${s.water_ml ?? 'x'}-${s.stress ?? 'x'}`)
      .join('|')
  }, [stats])

  useEffect(() => {
    let active = true
    async function run() {
      if (!signature) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/body-stats/advice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stats: stats.slice(-7) })
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(json.error || 'Failed to fetch advice')
        }
        const payload = json as CoachResponse
        if (!active) return
        setData(payload)
      } catch (error: any) {
        if (!active) return
        setError(error.message || 'Unexpected error')
        setData(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    if (stats.length) run()

    return () => {
      active = false
    }
  }, [signature, stats])

  return { data, loading, error }
}

export default useBodyStatsCoach
