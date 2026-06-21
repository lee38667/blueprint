import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'
import { authedFetch } from '../lib/apiClient'
import type { AISnapshot } from '../lib/aiSnapshot'

export interface Notification {
  id: string
  title: string
  message: string | null
  due_at: string | null
  status: 'pending' | 'done' | 'snoozed'
  created_at: string
}

export function useNotifications() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useToastStore()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabaseWithRetry(() =>
        supabase.from('notifications').select('id,title,message,due_at,status,created_at').order('created_at', { ascending: false })
      )
      setItems((data ?? []) as Notification[])
      setError(null)
    } catch (err) {
      handleError(err, { fallback: 'Failed to load notifications', setError, toast })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const addNotification = async (payload: Partial<Notification>, options?: { silent?: boolean }) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('notifications').insert({
        title: payload.title,
        message: payload.message ?? null,
        due_at: payload.due_at ?? null,
        status: payload.status ?? 'pending'
      }))
      if (!options?.silent) {
        toast.success('Notification created')
      }
      await load()
    } catch (err) {
      handleError(err, { fallback: 'Failed to create notification', setError, toast })
    }
  }

  const updateNotification = async (id: string, patch: Partial<Notification>) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('notifications').update(patch).eq('id', id))
      toast.success('Notification updated')
      await load()
    } catch (err) {
      handleError(err, { fallback: 'Failed to update notification', setError, toast })
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('notifications').delete().eq('id', id))
      toast.success('Notification removed')
      await load()
    } catch (err) {
      handleError(err, { fallback: 'Failed to delete notification', setError, toast })
    }
  }

  const clearDone = async () => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('notifications').delete().eq('status', 'done'))
      toast.success('Completed reminders cleared')
      await load()
    } catch (err) {
      handleError(err, { fallback: 'Failed to clear reminders', setError, toast })
    }
  }

  const pendingCount = useMemo(() => items.filter((item) => item.status === 'pending').length, [items])

  const evaluateAndInsert = useCallback(async (snapshot: AISnapshot, habitData?: { habits: any[]; logs: any[] }) => {
    try {
      const res = await authedFetch('/api/notifications/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot, habits: habitData })
      })
      const data = await res.json()
      if (!res.ok || !data.notifications) return

      const today = new Date().toISOString().slice(0, 10)
      const todaysItems = items.filter((item) => item.created_at?.slice(0, 10) === today)

      for (const notification of data.notifications) {
        const alreadyExists = todaysItems.some((existing) => existing.title === notification.title)
        if (!alreadyExists) {
          await supabaseWithRetry(() => supabase.from('notifications').insert({
            title: notification.title,
            message: notification.message,
            status: 'pending'
          }))
        }
      }
      await load()
    } catch {
      // Silent failure to avoid disrupting the user
    }
  }, [items, load])

  return { items, loading, error, pendingCount, addNotification, updateNotification, deleteNotification, clearDone, evaluateAndInsert, refresh: load }
}

export default useNotifications
