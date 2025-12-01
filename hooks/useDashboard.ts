import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useDashboard(){
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      // sample fetch: user's finance summary
      try{
        const { data: summary } = await supabase.from('finance_summary').select('*').maybeSingle()
        if (mounted) setData({ balance: summary?.balance ?? 0 })
      }catch(e){
        if (mounted) setData(null)
      }
      setLoading(false)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  return { loading, data }
}

export default useDashboard
