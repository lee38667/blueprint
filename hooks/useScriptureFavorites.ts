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

  const addFavorite = async (favorite: Omit<ScriptureFavorite, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('scripture_favorites')
      .insert(favorite)
      .select()
    
    if (!error && data) {
      setFavorites(prev => [data[0] as ScriptureFavorite, ...prev])
    }
    return { data, error }
  }

  const removeFavorite = async (id: string) => {
    const { error } = await supabase
      .from('scripture_favorites')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setFavorites(prev => prev.filter(f => f.id !== id))
    }
    return { error }
  }

  return { favorites, loading, addFavorite, removeFavorite }
}

export default useScriptureFavorites
