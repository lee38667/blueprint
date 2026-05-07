import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useToastStore } from '../lib/toastStore'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'

export function useLifeArea(){
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [areas, setAreas] = useState<any[]>([])
  const toast = useToastStore()

  const fetchAreas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await supabaseWithRetry(() => supabase.from('life_areas').select('*'))
      setAreas(data ?? [])
    } catch (err: any) {
      handleError(err, { fallback: 'Failed to load life areas', setError, toast })
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
      await supabaseWithRetry(() => supabase.from('life_areas').insert(payload))
      await fetchAreas()
      toast.success('Life area created')
    } catch (err: any) {
      handleError(err, { fallback: 'Failed to create life area', setError, toast })
    }
  }, [fetchAreas, toast])

  const updateArea = useCallback(async (id: string, patch: any) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('life_areas').update(patch).eq('id', id))
      await fetchAreas()
      toast.success('Life area updated')
    } catch (err: any) {
      handleError(err, { fallback: 'Failed to update life area', setError, toast })
    }
  }, [fetchAreas, toast])

  const deleteArea = useCallback(async (id: string) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('life_areas').delete().eq('id', id))
      await fetchAreas()
      toast.success('Life area deleted')
    } catch (err: any) {
      handleError(err, { fallback: 'Failed to delete life area', setError, toast })
    }
  }, [fetchAreas, toast])

  return { loading, error, areas, addArea, updateArea, deleteArea }
}

export default useLifeArea
