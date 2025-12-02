import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface MoodLog {
  id: string
  mood_label: string | null
  mood_score: number | null
  stress_score: number | null
  note: string | null
  created_at: string
}

export function useMoodLogs() {
  const [logs, setLogs] = useState<MoodLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('mood_logs')
        .select('id,mood_label,mood_score,stress_score,note,created_at')
        .order('created_at', { ascending: true })
      if (!mounted) return
      setLogs((data ?? []) as MoodLog[])
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const addLog = async (payload: { mood_label?: string; mood_score?: number; stress_score?: number; note?: string }) => {
    await supabase.from('mood_logs').insert({
      mood_label: payload.mood_label,
      mood_score: payload.mood_score,
      stress_score: payload.stress_score,
      note: payload.note
    })
  }

  return { logs, loading, addLog }
}

export default useMoodLogs
