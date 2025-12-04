import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface Notification {
  id: string
  title: string
  message: string | null
  due_at: string | null
  status: 'pending' | 'done' | 'snoozed'
  created_at: string
}

export function useNotifications(){
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      const { data } = await supabase.from('notifications').select('id,title,message,due_at,status,created_at').order('created_at', { ascending: false })
      if (!mounted) return
      setItems((data ?? []) as Notification[])
      setLoading(false)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  const addNotification = async (payload: Partial<Notification>) => {
    const { error } = await supabase.from('notifications').insert({
      title: payload.title,
      message: payload.message ?? null,
      due_at: payload.due_at ?? null,
      status: payload.status ?? 'pending'
    })
    if (error) throw error
  }

  const updateNotification = async (id: string, patch: Partial<Notification>) => {
    const { error } = await supabase.from('notifications').update(patch).eq('id', id)
    if (error) throw error
  }

  return { items, loading, addNotification, updateNotification }
}

export default useNotifications
