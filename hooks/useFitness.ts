import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface FitnessSample {
  day: string
  steps: number | null
  sleep_min: number | null
  resting_hr: number | null
  weight_kg: number | null
  calories: number | null
}

/**
 * Google Fit connection + synced daily samples (steps/sleep/heart-rate/weight).
 * Galaxy Watch 4 data flows in via the Samsung Health → Health Connect → Google
 * Fit bridge, so it appears here with no extra wiring.
 */
export function useFitness() {
  const [connected, setConnected] = useState(false)
  const [samples, setSamples] = useState<FitnessSample[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authHeader = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session ? { Authorization: `Bearer ${session.access_token}` } : {}
  }

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: conn }, { data: rows }] = await Promise.all([
        supabase.from('fitness_connections').select('id').eq('user_id', user.id).eq('provider', 'google_fit').maybeSingle(),
        supabase.from('fitness_samples').select('day,steps,sleep_min,resting_hr,weight_kg,calories').order('day', { ascending: false }).limit(14),
      ])

      setConnected(!!conn)
      setSamples((rows ?? []) as FitnessSample[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const connect = async () => {
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !session) {
      setError('Session expired. Please log in again.')
      return
    }
    window.location.href = `/api/fitness/auth?token=${session.access_token}`
  }

  const disconnect = async () => {
    const res = await fetch('/api/fitness/disconnect', { method: 'DELETE', headers: await authHeader() })
    if (res.ok) {
      setConnected(false)
    }
  }

  const sync = async (days = 7) => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/fitness/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ days }),
      })
      if (!res.ok) {
        setError((await res.json()).error || 'Sync failed')
        return
      }
      await load()
    } finally {
      setSyncing(false)
    }
  }

  const latest = samples[0] ?? null

  return { connected, samples, latest, loading, syncing, error, connect, disconnect, sync, refresh: load }
}

export default useFitness
