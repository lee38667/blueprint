import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'

interface DashboardData {
  balance: number
  balanceHistory: number[]
  balanceLabels: string[]
  weightHistory: number[]
  weightLabels: string[]
}

export function useDashboard(){
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const toast = useToastStore()

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      try{
        const [{ data: summary }, { data: history }, { data: logs }] = await Promise.all([
          supabaseWithRetry(() => supabase.from('finance_summary').select('*').maybeSingle()) as Promise<{ data: any; error: any }>,
          supabaseWithRetry(() => supabase.from('finance_history').select('recorded_at,balance').order('recorded_at', { ascending: true })),
          supabaseWithRetry(() => supabase.from('workout_logs').select('performed_at,metrics').order('performed_at', { ascending: true }))
        ])

        if (!mounted) return

        const balance = (summary?.balance as number) ?? 0

        const hist = (history ?? []) as { recorded_at: string; balance: number }[]
        const balanceHistory = hist.map(h => h.balance)
        const balanceLabels = hist.map(h => new Date(h.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))

        const wlogs = (logs ?? []) as { performed_at: string; metrics: any }[]
        const weightPoints = wlogs
          .map(l => ({
            date: new Date(l.performed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            weight: typeof l.metrics?.weight === 'number' ? l.metrics.weight : null
          }))
          .filter(x => x.weight !== null) as { date: string; weight: number }[]

        const weightHistory = weightPoints.map(p => p.weight)
        const weightLabels = weightPoints.map(p => p.date)

        setData({
          balance,
          balanceHistory,
          balanceLabels,
          weightHistory,
          weightLabels
        })
        setError(null)
      }catch(e){
        if (mounted) {
          handleError(e, { fallback: 'Failed to load dashboard data', setError, toast })
          setData(null)
        }
      }
      setLoading(false)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  return { loading, data, error }
}

export default useDashboard
