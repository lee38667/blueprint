import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
import type { FinanceLog, SavingsTarget } from '../types/models'

export function useFinance(){
  const summary = useDataStore(s => s.financeSummary)
  const history = useDataStore(s => s.financeHistory)
  const logs = useDataStore(s => s.financeLogs)
  const targets = useDataStore(s => s.savingsTargets)
  const loading = useDataStore(s => s.financeLoading)
  const loaded = useDataStore(s => s.financeLoaded)
  const fetchFinance = useDataStore(s => s.fetchFinance)

  useEffect(()=>{
    if (!loaded) fetchFinance()
  },[loaded, fetchFinance])

  const addLog = async (payload: Partial<FinanceLog>) => {
    const { error } = await supabase.from('finance_logs').insert({
      type: payload.type,
      amount: payload.amount,
      category: payload.category ?? null,
      note: payload.note ?? null
    })
    if (error) throw error
    await fetchFinance()
  }

  const addTarget = async (month: string, amount: number) => {
    const { error } = await supabase.from('savings_targets').insert({ month, target_amount: amount })
    if (error) throw error
    await fetchFinance()
  }

  return { loading, summary, history, logs, targets, addLog, addTarget }
}

export default useFinance
