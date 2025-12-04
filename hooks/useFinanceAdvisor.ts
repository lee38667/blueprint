import { useEffect, useMemo, useState } from 'react'
import type {
  FinanceCategoryTrend,
  FinanceCoachAdvice,
  FinanceHistoryEntry,
  FinanceLog,
  FinanceProjectionPoint,
  FinanceSummary
} from '../types/models'

function buildProjections(summary: FinanceSummary | null, history: FinanceHistoryEntry[]): FinanceProjectionPoint[] {
  if (!history.length && !summary?.balance) return []
  const ordered = [...history].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
  const recent = ordered.slice(-4)
  const deltas: number[] = []
  for (let i = 1; i < recent.length; i += 1) {
    deltas.push(Number(recent[i].balance) - Number(recent[i - 1].balance))
  }
  const avgDelta = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0
  const baseBalance = Number((recent.at(-1)?.balance ?? summary?.balance ?? 0))
  const startDate = new Date(recent.at(-1)?.recorded_at ?? Date.now())
  const projections: FinanceProjectionPoint[] = []
  for (let i = 1; i <= 3; i += 1) {
    const future = new Date(startDate)
    future.setMonth(future.getMonth() + i)
    projections.push({ label: future.toLocaleDateString('en-US', { month: 'short' }), value: Number(baseBalance + avgDelta * i) })
  }
  return projections
}

function buildCategoryTrends(logs: FinanceLog[]): FinanceCategoryTrend[] {
  if (!logs.length) return []
  const map = new Map<string, FinanceCategoryTrend>()
  logs.forEach((log) => {
    const key = log.category || 'Uncategorized'
    if (!map.has(key)) {
      map.set(key, { category: key, income: 0, expense: 0 })
    }
    const entry = map.get(key)!
    if (log.type === 'income') {
      entry.income += Number(log.amount)
    } else {
      entry.expense += Number(log.amount)
    }
  })
  return Array.from(map.values()).sort((a, b) => b.income + b.expense - (a.income + a.expense)).slice(0, 6)
}

export function useFinanceAdvisor(summary: FinanceSummary | null, history: FinanceHistoryEntry[], logs: FinanceLog[]) {
  const projections = useMemo(() => buildProjections(summary, history), [summary, history])
  const categoryTrends = useMemo(() => buildCategoryTrends(logs), [logs])

  const [advice, setAdvice] = useState<FinanceCoachAdvice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signature = useMemo(() => {
    const historySig = history
      .slice(-4)
      .map((h) => `${h.recorded_at.slice(0, 10)}:${h.balance}`)
      .join('|')
    const logSig = logs
      .slice(0, 5)
      .map((l) => `${l.type}:${l.amount}:${l.category ?? 'na'}`)
      .join('|')
    return `${summary?.balance ?? 0}-${historySig}-${logSig}`
  }, [summary, history, logs])

  useEffect(() => {
    let active = true
    async function run() {
      if (!history.length && !logs.length) {
        setAdvice(null)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/finance/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary, history: history.slice(-6), logs: logs.slice(0, 10) })
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(json.error || 'Failed to fetch finance tips')
        }
        if (!active) return
        setAdvice(json as FinanceCoachAdvice)
      } catch (error: any) {
        if (!active) return
        setError(error.message || 'Unexpected error')
        setAdvice(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    run()
    return () => {
      active = false
    }
  }, [signature, summary, history, logs])

  return { projections, categoryTrends, advice, loading, error }
}

export default useFinanceAdvisor
