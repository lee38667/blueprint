import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useNotes(){
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<any[]>([])

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false })
      if (mounted) setNotes(data ?? [])
      setLoading(false)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  return { loading, notes }
}

export default useNotes
