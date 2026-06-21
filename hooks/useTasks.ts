import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'
import { maybeCompleteQuest } from '../lib/gamificationClient'
import type { Task } from '../types/models'

export function useTasks() {
  const tasks = useDataStore(s => s.tasks)
  const loading = useDataStore(s => s.tasksLoading)
  const loaded = useDataStore(s => s.tasksLoaded)
  const fetchTasks = useDataStore(s => s.fetchTasks)
  const toast = useToastStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded) fetchTasks()
  }, [loaded, fetchTasks])

  const addTask = async (payload: Partial<Task>) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('tasks').insert({
        title: payload.title,
        description: payload.description ?? null,
        priority: payload.priority ?? 'normal',
        status: payload.status ?? 'todo',
        project: payload.project ?? null,
        due_date: payload.due_date ?? null,
        goal_id: payload.goal_id ?? null
      }))
      await fetchTasks()
      toast.success('Task added')
    } catch (err) {
      handleError(err, { fallback: 'Failed to add task', setError, toast })
    }
  }

  const updateTask = async (id: string, patch: Partial<Task>) => {
    try {
      setError(null)
      const current = tasks.find((task) => task.id === id)
      // Stamp updated_at so analytics can use it as a completion timestamp.
      const stampedPatch = { ...patch, updated_at: new Date().toISOString() }
      await supabaseWithRetry(() => supabase.from('tasks').update(stampedPatch).eq('id', id))
      if (patch.status === 'done' && current?.status !== 'done') {
        const reward = await maybeCompleteQuest({ sourceType: 'task', linkedId: id })
        if (reward?.narrative) {
          toast.info(reward.narrative)
        }
      }
      await fetchTasks()
      toast.success('Task updated')
    } catch (err) {
      handleError(err, { fallback: 'Failed to update task', setError, toast })
    }
  }

  const removeTask = async (id: string) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('tasks').delete().eq('id', id))
      await fetchTasks()
      toast.success('Task deleted')
    } catch (err) {
      handleError(err, { fallback: 'Failed to delete task', setError, toast })
    }
  }

  return { tasks, loading, error, addTask, updateTask, removeTask }
}

export default useTasks

