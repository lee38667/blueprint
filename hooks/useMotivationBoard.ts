import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'

export interface MotivationItem {
  id: string
  kind: string | null
  title: string | null
  body: string | null
  image_url: string | null
  tags: string[] | null
}

export function useMotivationBoard() {
  const [items, setItems] = useState<MotivationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useToastStore()

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabaseWithRetry(() =>
        supabase
          .from('motivations')
          .select('id,kind,title,body,image_url,tags')
          .order('created_at', { ascending: false })
      )
      setError(null)
      setItems((data ?? []) as MotivationItem[])
    } catch (err) {
      handleError(err, { fallback: 'Failed to load motivation items', setError, toast })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const addItem = async (payload: Partial<MotivationItem>) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('motivations').insert({
        kind: payload.kind ?? 'quote',
        title: payload.title,
        body: payload.body,
        image_url: payload.image_url,
        tags: payload.tags ?? null
      }))
      toast.success('Motivation added')
      await loadItems()
    } catch (err) {
      handleError(err, { fallback: 'Failed to add motivation item', setError, toast })
    }
  }

  const removeItem = async (id: string) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('motivations').delete().eq('id', id))
      toast.success('Motivation removed')
      await loadItems()
    } catch (err) {
      handleError(err, { fallback: 'Failed to remove motivation item', setError, toast })
    }
  }

  return { items, loading, error, addItem, removeItem, refresh: loadItems }
}

export default useMotivationBoard
