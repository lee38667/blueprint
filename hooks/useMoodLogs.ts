import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'

export function useMoodLogs() {
  const logs = useDataStore(s => s.moodLogs)
  const loading = useDataStore(s => s.moodLoading)
  const loaded = useDataStore(s => s.moodLoaded)
  const fetchMoodLogs = useDataStore(s => s.fetchMoodLogs)

  useEffect(() => {
    if (!loaded) fetchMoodLogs()
  }, [loaded, fetchMoodLogs])

  const addLog = async (payload: { mood_label?: string; mood_score?: number; stress_score?: number; note?: string }) => {
    await supabase.from('mood_logs').insert({
      mood_label: payload.mood_label,
      mood_score: payload.mood_score,
      stress_score: payload.stress_score,
      note: payload.note
    })
    await fetchMoodLogs()
  }

  return { logs, loading, addLog }
}

export default useMoodLogs
