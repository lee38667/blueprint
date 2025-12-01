import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSkills(){
  const [loading, setLoading] = useState(true)
  const [skills, setSkills] = useState<any[]>([])

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      const { data } = await supabase.from('skills').select('*')
      if (mounted) setSkills(data ?? [])
      setLoading(false)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  return { loading, skills }
}

export default useSkills
