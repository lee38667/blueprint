import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface ScriptureFavorite {
  id: string
  verse: string
  reference: string
  created_at: string
}

export function useScriptureFavorites(){
  const [favorites, setFavorites] = useState<ScriptureFavorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      const { data } = await supabase.from('scripture_favorites').select('id,verse,reference,created_at').order('created_at', { ascending: false })
      if (!mounted) return
      setFavorites((data ?? []) as ScriptureFavorite[])
      setLoading(false)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  return { favorites, loading }
}

export default useScriptureFavorites
