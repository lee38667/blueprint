import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useToastStore } from '../lib/toastStore'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { maybeCompleteQuest } from '../lib/gamificationClient'

export function useGym(){
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workouts, setWorkouts] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const toast = useToastStore()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [workoutData, logData] = await Promise.all([
        supabaseWithRetry(() => supabase.from('workouts').select('*').order('day')),
        supabaseWithRetry(() => supabase.from('workout_logs').select('*').order('performed_at', { ascending: false }))
      ])

      setWorkouts(workoutData.data ?? [])
      setLogs(logData.data ?? [])
    } catch (err) {
      handleError(err, { fallback: 'Failed to load gym data', setError, toast })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(()=>{
    load()
  },[load])

  const addWorkout = useCallback(async (payload: any) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('workouts').insert(payload))
      const { data } = await supabaseWithRetry(() => supabase.from('workouts').select('*').order('day'))
      setWorkouts(data ?? [])
      toast.success('Workout created')
    } catch (err: any) {
      handleError(err, { fallback: 'Failed to create workout', setError, toast })
    }
  }, [toast])

  const addLog = useCallback(async (workoutId: string, payload: any) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('workout_logs').insert({
        workout_id: workoutId,
        ...payload
      }))
      const reward = await maybeCompleteQuest({ sourceType: 'workout', linkedId: workoutId })
      const { data } = await supabaseWithRetry(() => supabase.from('workout_logs').select('*').order('performed_at', { ascending: false }))
      setLogs(data ?? [])
      if (reward?.narrative) {
        toast.info(reward.narrative)
      }
      toast.success('Workout logged')
    } catch (err: any) {
      handleError(err, { fallback: 'Failed to log workout', setError, toast })
    }
  }, [toast])

  const updateWorkout = useCallback(async (id: string, patch: any) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('workouts').update(patch).eq('id', id))
      const { data } = await supabaseWithRetry(() => supabase.from('workouts').select('*').order('day'))
      setWorkouts(data ?? [])
      toast.success('Workout updated')
    } catch (err: any) {
      handleError(err, { fallback: 'Failed to update workout', setError, toast })
    }
  }, [toast])

  const deleteWorkout = useCallback(async (id: string) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('workouts').delete().eq('id', id))
      const [w, l] = await Promise.all([
        supabaseWithRetry(() => supabase.from('workouts').select('*').order('day')),
        supabaseWithRetry(() => supabase.from('workout_logs').select('*').order('performed_at', { ascending: false })),
      ])
      setWorkouts(w.data ?? [])
      setLogs(l.data ?? [])
      toast.success('Workout deleted')
    } catch (err: any) {
      handleError(err, { fallback: 'Failed to delete workout', setError, toast })
    }
  }, [toast])

  const updateLog = useCallback(async (id: string, patch: any) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('workout_logs').update(patch).eq('id', id))
      const { data } = await supabaseWithRetry(() => supabase.from('workout_logs').select('*').order('performed_at', { ascending: false }))
      setLogs(data ?? [])
      toast.success('Log updated')
    } catch (err: any) {
      handleError(err, { fallback: 'Failed to update log', setError, toast })
    }
  }, [toast])

  const deleteLog = useCallback(async (id: string) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('workout_logs').delete().eq('id', id))
      const { data } = await supabaseWithRetry(() => supabase.from('workout_logs').select('*').order('performed_at', { ascending: false }))
      setLogs(data ?? [])
      toast.success('Log removed')
    } catch (err: any) {
      handleError(err, { fallback: 'Failed to remove log', setError, toast })
    }
  }, [toast])

  return { loading, error, workouts, logs, addWorkout, addLog, updateWorkout, deleteWorkout, updateLog, deleteLog, refresh: load }
}

export default useGym

