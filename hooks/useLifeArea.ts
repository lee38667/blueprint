import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useLifeArea(){
  const [loading, setLoading] = useState(true)
  const [lifeAreas, setLifeAreas] = useState<any[]>([])

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      const { data } = await supabase.from('life_areas').select('*')
      if (mounted) setLifeAreas(data ?? [])
      setLoading(false)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  return { loading, lifeAreas }
}

export default useLifeArea
