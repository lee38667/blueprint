import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
import type { BodyStat } from '../types/models'

export function useBodyStats(){
  const stats = useDataStore(s => s.bodyStats)
  const loading = useDataStore(s => s.bodyLoading)
  const loaded = useDataStore(s => s.bodyLoaded)
  const fetchBodyStats = useDataStore(s => s.fetchBodyStats)

  useEffect(()=>{
    if (!loaded) fetchBodyStats()
  },[loaded, fetchBodyStats])

  const addStat = async (payload: Partial<BodyStat>) => {
    const { error } = await supabase.from('body_stats').insert({
      weight: payload.weight ?? null,
      sleep_hours: payload.sleep_hours ?? null,
      water_ml: payload.water_ml ?? null,
      stress: payload.stress ?? null
    })
    if (error) throw error
    await fetchBodyStats()
  }

  return { stats, loading, addStat }
}

export default useBodyStats
