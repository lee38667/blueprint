import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
import type { Task } from '../types/models'

export function useTasks() {
  const tasks = useDataStore(s => s.tasks)
  const loading = useDataStore(s => s.tasksLoading)
  const loaded = useDataStore(s => s.tasksLoaded)
  const fetchTasks = useDataStore(s => s.fetchTasks)

  useEffect(() => {
    if (!loaded) fetchTasks()
  }, [loaded, fetchTasks])

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
    await fetchTasks()
  }

  const updateTask = async (id: string, patch: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(patch).eq('id', id)
    if (error) throw error
    await fetchTasks()
  }

  const removeTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
    await fetchTasks()
  }

  return { tasks, loading, addTask, updateTask, removeTask }
}

export default useTasks
