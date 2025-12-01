import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useContentLibrary(){
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      const { data } = await supabase.from('content').select('*').order('created_at', { ascending: false })
      if (mounted) setItems(data ?? [])
      setLoading(false)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  return { loading, items }
}

export default useContentLibrary
