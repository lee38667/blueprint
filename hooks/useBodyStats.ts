import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface BodyStat { id: string; recorded_at: string; weight: number|null; sleep_hours: number|null; water_ml: number|null; stress: number|null }

export function useBodyStats(){
  const [stats, setStats] = useState<BodyStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      const { data } = await supabase.from('body_stats').select('id,recorded_at,weight,sleep_hours,water_ml,stress').order('recorded_at')
      if (!mounted) return
      setStats((data ?? []) as BodyStat[])
      setLoading(false)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  const addStat = async (payload: Partial<BodyStat>) => {
    const { error } = await supabase.from('body_stats').insert({
      weight: payload.weight ?? null,
      sleep_hours: payload.sleep_hours ?? null,
      water_ml: payload.water_ml ?? null,
      stress: payload.stress ?? null
    })
    if (error) throw error
  }

  return { stats, loading, addStat }
}

export default useBodyStats
