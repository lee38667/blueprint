import { useMemo, useState } from 'react'
import { useTasks } from './useTasks'
import { useHabits } from './useHabits'
import { buildReport } from '../lib/analyticsEngine'
import type { PeriodReport, ReportPeriod } from '../types/models'

/**
 * Computes a weekly or monthly productivity report from the shared task and
 * habit stores. Returns the report plus the period toggle and a loading flag.
 */
export function useReports(initialPeriod: ReportPeriod = 'week') {
  const [period, setPeriod] = useState<ReportPeriod>(initialPeriod)
  const { tasks, loading: tasksLoading } = useTasks()
  const { habits, habitLogs, loading: habitsLoading } = useHabits()

  const report = useMemo<PeriodReport>(
    () => buildReport(tasks, habits, habitLogs, period),
    [tasks, habits, habitLogs, period],
  )

  const hasData = tasks.length > 0 || habits.length > 0

  return {
    period,
    setPeriod,
    report,
    hasData,
    loading: tasksLoading || habitsLoading,
  }
}

export default useReports
