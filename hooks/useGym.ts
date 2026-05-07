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

  return { loading, error, workouts, logs, addWorkout, addLog, refresh: load }
}

export default useGym

