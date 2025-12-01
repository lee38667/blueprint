import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useGym(){
  const [loading, setLoading] = useState(true)
  const [workouts, setWorkouts] = useState<any[]>([])

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      const { data } = await supabase.from('workouts').select('*').order('day')
      if (mounted) setWorkouts(data ?? [])
      setLoading(false)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  return { loading, workouts }
}

export default useGym
