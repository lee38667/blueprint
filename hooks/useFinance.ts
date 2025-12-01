import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useFinance(){
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      const { data } = await supabase.from('finance_summary').select('*').maybeSingle()
      if (mounted) setSummary(data ?? null)
      setLoading(false)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  return { loading, summary }
}

export default useFinance
