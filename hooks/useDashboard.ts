import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

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

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      setLoading(true)
      try{
        const [{ data: summary }, { data: history }, { data: logs }] = await Promise.all([
          supabase.from('finance_summary').select('*').maybeSingle(),
          supabase.from('finance_history').select('recorded_at,balance').order('recorded_at', { ascending: true }),
          supabase.from('workout_logs').select('performed_at,metrics').order('performed_at', { ascending: true })
        ])

        if (!mounted) return

        const balance = summary?.balance ?? 0

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
      }catch(e){
        if (mounted) setData(null)
      }
      setLoading(false)
    }
    load()
    return ()=>{ mounted = false }
  },[])

  return { loading, data }
}

export default useDashboard
