import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'
import type { BodyStat } from '../types/models'

export function useBodyStats(){
  const stats = useDataStore(s => s.bodyStats)
  const loading = useDataStore(s => s.bodyLoading)
  const loaded = useDataStore(s => s.bodyLoaded)
  const fetchBodyStats = useDataStore(s => s.fetchBodyStats)
  const toast = useToastStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{
    if (!loaded) fetchBodyStats()
  },[loaded, fetchBodyStats])

  const addStat = async (payload: Partial<BodyStat>) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('body_stats').insert({
        weight: payload.weight ?? null,
        sleep_hours: payload.sleep_hours ?? null,
        water_ml: payload.water_ml ?? null,
        stress: payload.stress ?? null
      }))
      await fetchBodyStats()
      toast.success('Body stat recorded')
    } catch (err) {
      handleError(err, { fallback: 'Failed to record stat', setError, toast })
    }
  }

  return { stats, loading, error, addStat }
}

export default useBodyStats
