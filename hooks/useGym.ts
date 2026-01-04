import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useToastStore } from '../lib/toastStore'

export function useGym(){
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workouts, setWorkouts] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const toast = useToastStore()

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      setError(null)
      try {
        const { data: workoutData, error: workoutError } = await supabase.from('workouts').select('*').order('day')
        if (workoutError) throw workoutError
        
        const { data: logData, error: logError } = await supabase.from('workout_logs').select('*').order('performed_at', { ascending: false })
        if (logError) throw logError
        
        if (mounted) {
          setWorkouts(workoutData ?? [])
          setLogs(logData ?? [])
        }
      } catch (err: any) {
        const message = err.message || 'Failed to load gym data'
        if (mounted) setError(message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return ()=>{ mounted = false }
  },[])

  const addWorkout = useCallback(async (payload: any) => {
    try {
      setError(null)
      const { error: err } = await supabase.from('workouts').insert(payload)
      if (err) throw err
      const { data } = await supabase.from('workouts').select('*').order('day')
      setWorkouts(data ?? [])
      toast.success('Workout created')
    } catch (err: any) {
      const message = err.message || 'Failed to create workout'
      setError(message)
      toast.error(message)
    }
  }, [toast])

  const addLog = useCallback(async (workoutId: string, payload: any) => {
    try {
      setError(null)
      const { error: err } = await supabase.from('workout_logs').insert({
        workout_id: workoutId,
        ...payload
      })
      if (err) throw err
      const { data } = await supabase.from('workout_logs').select('*').order('performed_at', { ascending: false })
      setLogs(data ?? [])
      toast.success('Workout logged')
    } catch (err: any) {
      const message = err.message || 'Failed to log workout'
      setError(message)
      toast.error(message)
    }
  }, [toast])

  return { loading, error, workouts, logs, addWorkout, addLog }
}

export default useGym
