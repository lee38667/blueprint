import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useToastStore } from '../lib/toastStore'

export function useLifeArea(){
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [areas, setAreas] = useState<any[]>([])
  const toast = useToastStore()

  const fetchAreas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase.from('life_areas').select('*')
      if (err) throw err
      setAreas(data ?? [])
    } catch (err: any) {
      const message = err.message || 'Failed to load life areas'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      await fetchAreas()
    }
    load()
    return ()=>{ mounted = false }
  }, [fetchAreas])

  const addArea = useCallback(async (payload: any) => {
    try {
      setError(null)
      const { error: err } = await supabase.from('life_areas').insert(payload)
      if (err) throw err
      await fetchAreas()
      toast.success('Life area created')
    } catch (err: any) {
      const message = err.message || 'Failed to create life area'
      setError(message)
      toast.error(message)
    }
  }, [fetchAreas, toast])

  const updateArea = useCallback(async (id: string, patch: any) => {
    try {
      setError(null)
      const { error: err } = await supabase.from('life_areas').update(patch).eq('id', id)
      if (err) throw err
      await fetchAreas()
      toast.success('Life area updated')
    } catch (err: any) {
      const message = err.message || 'Failed to update life area'
      setError(message)
      toast.error(message)
    }
  }, [fetchAreas, toast])

  const deleteArea = useCallback(async (id: string) => {
    try {
      setError(null)
      const { error: err } = await supabase.from('life_areas').delete().eq('id', id)
      if (err) throw err
      await fetchAreas()
      toast.success('Life area deleted')
    } catch (err: any) {
      const message = err.message || 'Failed to delete life area'
      setError(message)
      toast.error(message)
    }
  }, [fetchAreas, toast])

  return { loading, error, areas, addArea, updateArea, deleteArea }
}

export default useLifeArea
