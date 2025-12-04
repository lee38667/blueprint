import { useMemo } from 'react'
import type { ProductivityAnalytics, Task } from '../types/models'

const emptyTotals: Record<'low' | 'normal' | 'high', number> = { low: 0, normal: 0, high: 0 }

export function useProductivityAnalytics(tasks: Task[]) {
  return useMemo<ProductivityAnalytics>(() => {
    if (!tasks.length) {
      return {
        completionRate: 0,
        overdueCount: 0,
        activeCount: 0,
        weeklyLabels: Array(7).fill('').map((_, idx) => `Day ${idx + 1}`),
        weeklyVelocity: Array(7).fill(0),
        priorityTotals: { ...emptyTotals },
        focusProjects: []
      }
    }

    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'done').length
    const completionRate = Math.round((completed / total) * 100)

    const todayMidnight = new Date()
    todayMidnight.setHours(0, 0, 0, 0)
    const overdueCount = tasks.filter((t) => {
      if (!t.due_date || t.status === 'done') return false
      return new Date(t.due_date).getTime() < todayMidnight.getTime()
    }).length

    const activeCount = tasks.filter((t) => t.status !== 'done').length

    const priorityTotals = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] ?? 0) + 1
      return acc
    }, { ...emptyTotals })

    const projectMap = tasks.reduce<Record<string, number>>((acc, task) => {
      if (!task.project) return acc
      acc[task.project] = (acc[task.project] ?? 0) + 1
      return acc
    }, {})
    const focusProjects = Object.entries(projectMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({ name, count }))

    const weeklyLabels: string[] = []
    const weeklyVelocity: number[] = []
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date()
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() - offset)
      const label = day.toLocaleDateString('en-US', { weekday: 'short' })
      weeklyLabels.push(label)
      const count = tasks.filter((task) => {
        const created = new Date(task.created_at)
        return created.getFullYear() === day.getFullYear() && created.getMonth() === day.getMonth() && created.getDate() === day.getDate()
      }).length
      weeklyVelocity.push(count)
    }

    return {
      completionRate,
      overdueCount,
      activeCount,
      weeklyLabels,
      weeklyVelocity,
      priorityTotals,
      focusProjects
    }
  }, [tasks])
}

export default useProductivityAnalytics
