import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'

export function useMoodLogs() {
  const logs = useDataStore(s => s.moodLogs)
  const loading = useDataStore(s => s.moodLoading)
  const loaded = useDataStore(s => s.moodLoaded)
  const fetchMoodLogs = useDataStore(s => s.fetchMoodLogs)
  const toast = useToastStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded) fetchMoodLogs()
  }, [loaded, fetchMoodLogs])

  const addLog = async (payload: { mood_label?: string; mood_score?: number; stress_score?: number; note?: string }) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('mood_logs').insert({
        mood_label: payload.mood_label,
        mood_score: payload.mood_score,
        stress_score: payload.stress_score,
        note: payload.note
      }))
      await fetchMoodLogs()
      toast.success('Mood logged')
    } catch (err) {
      handleError(err, { fallback: 'Failed to log mood', setError, toast })
    }
  }

  return { logs, loading, error, addLog }
}

export default useMoodLogs
