import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

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

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('motivations')
        .select('id,kind,title,body,image_url,tags')
        .order('created_at', { ascending: false })

      if (!mounted) return
      if (error) {
        setError(error.message)
        setItems([])
      } else {
        setError(null)
        setItems((data ?? []) as MotivationItem[])
      }
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const addItem = async (payload: Partial<MotivationItem>) => {
    const { error } = await supabase.from('motivations').insert({
      kind: payload.kind ?? 'quote',
      title: payload.title,
      body: payload.body,
      image_url: payload.image_url,
      tags: payload.tags ?? null
    })
    if (error) throw error
  }

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('motivations').delete().eq('id', id)
    if (error) throw error
  }

  return { items, loading, error, addItem, removeItem }
}

export default useMotivationBoard
