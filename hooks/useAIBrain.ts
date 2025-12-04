import { useEffect, useMemo } from 'react'
import { AISnapshot } from '../lib/aiSnapshot'
import useTasks from './useTasks'
import useGoals from './useGoals'
import useFinance from './useFinance'
import useMoodLogs from './useMoodLogs'
import useBodyStats from './useBodyStats'
import useNotes from './useNotes'
import useAICopilot from './useAICopilot'

interface Options {
  auto?: boolean
}

export function useAIBrain(options: Options = {}) {
  const { auto = false } = options
  const { tasks, loading: tasksLoading } = useTasks()
  const { goals, loading: goalsLoading } = useGoals()
  const { logs: moodLogs, loading: moodsLoading } = useMoodLogs()
  const { stats, loading: statsLoading } = useBodyStats()
  const { summary, targets, loading: financeLoading } = useFinance()
  const { notes, loading: notesLoading } = useNotes()
  const { brainInsights, brainLoading, brainError, analyzeSnapshot } = useAICopilot()

  const snapshot: AISnapshot = useMemo(() => {
    return {
      tasks: tasks.slice(0, 12).map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        project: t.project,
        due_date: t.due_date
      })),
      goals: goals.slice(0, 10).map(g => ({
        title: g.title,
        status: g.status,
        target_date: g.target_date
      })),
      moods: moodLogs.slice(-10),
      bodyStats: stats.slice(-10),
      finance: {
        balance: summary?.balance ?? null,
        savings: summary?.savings ?? null,
        targets: targets
      },
      notes: (notes ?? []).slice(0, 5).map((n: any) => ({
        title: n.title ?? n.heading ?? 'Untitled',
        content: n.content ?? n.body ?? ''
      }))
    }
  }, [tasks, goals, moodLogs, stats, summary, targets, notes])

  const ready = !tasksLoading && !goalsLoading && !moodsLoading && !statsLoading && !financeLoading && !notesLoading
  const hasData = Boolean(
    snapshot.tasks.length ||
    snapshot.goals.length ||
    snapshot.moods.length ||
    snapshot.bodyStats.length ||
    snapshot.finance?.balance != null ||
    (snapshot.finance?.targets?.length ?? 0) ||
    (snapshot.notes?.length ?? 0)
  )

  useEffect(() => {
    if (!auto) return
    if (!ready || !hasData) return
    analyzeSnapshot(snapshot)
  }, [auto, ready, hasData, snapshot, analyzeSnapshot])

  return {
    ready,
    snapshot,
    insights: brainInsights,
    loading: auto ? brainLoading || !ready : brainLoading,
    error: brainError,
    refresh: () => analyzeSnapshot(snapshot, { force: true })
  }
}

export default useAIBrain
