import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface Goal {
  id: string
  title: string
  category: string | null
  target_date: string | null
  status: string
  progress_note: string | null
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('goals')
        .select('id,title,category,target_date,status,progress_note')
        .order('created_at', { ascending: false })
      if (!mounted) return
      setGoals((data ?? []) as Goal[])
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const addGoal = async (payload: Partial<Goal>) => {
    await supabase.from('goals').insert({
      title: payload.title,
      category: payload.category,
      target_date: payload.target_date,
      status: payload.status ?? 'active',
      progress_note: payload.progress_note
    })
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('goals').update({ status }).eq('id', id)
  }

  return { goals, loading, addGoal, updateStatus }
}

export default useGoals
