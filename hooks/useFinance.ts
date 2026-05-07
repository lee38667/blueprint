import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'
import type { FinanceLog, SavingsTarget } from '../types/models'

export function useFinance(){
  const summary = useDataStore(s => s.financeSummary)
  const history = useDataStore(s => s.financeHistory)
  const logs = useDataStore(s => s.financeLogs)
  const targets = useDataStore(s => s.savingsTargets)
  const loading = useDataStore(s => s.financeLoading)
  const loaded = useDataStore(s => s.financeLoaded)
  const fetchFinance = useDataStore(s => s.fetchFinance)
  const toast = useToastStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{
    if (!loaded) fetchFinance()
  },[loaded, fetchFinance])

  const addLog = async (payload: Partial<FinanceLog>) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('finance_logs').insert({
        type: payload.type,
        amount: payload.amount,
        category: payload.category ?? null,
        note: payload.note ?? null
      }))
      await fetchFinance()
      toast.success('Finance entry saved')
    } catch (err) {
      handleError(err, { fallback: 'Failed to add finance entry', setError, toast })
    }
  }

  const addTarget = async (month: string, amount: number) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('savings_targets').insert({ month, target_amount: amount }))
      await fetchFinance()
      toast.success('Savings target saved')
    } catch (err) {
      handleError(err, { fallback: 'Failed to add savings target', setError, toast })
    }
  }

  return { loading, summary, history, logs, targets, error, addLog, addTarget }
}

export default useFinance
