import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface Task {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'normal' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  project: string | null
  due_date: string | null
  created_at: string
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('tasks')
        .select('id,title,description,priority,status,project,due_date,created_at')
        .order('created_at', { ascending: false })
      if (!mounted) return
      setTasks((data ?? []) as Task[])
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  const addTask = async (payload: Partial<Task>) => {
    const { error } = await supabase.from('tasks').insert({
      title: payload.title,
      description: payload.description ?? null,
      priority: payload.priority ?? 'normal',
      status: payload.status ?? 'todo',
      project: payload.project ?? null,
      due_date: payload.due_date ?? null
    })
    if (error) throw error
  }

  const updateTask = async (id: string, patch: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(patch).eq('id', id)
    if (error) throw error
  }

  const removeTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
  }

  return { tasks, loading, addTask, updateTask, removeTask }
}

export default useTasks
