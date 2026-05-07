import type { AISnapshot } from './aiSnapshot'

export interface TriggeredNotification {
  title: string
  message: string
  dedupKey: string
}

interface HabitData {
  habits: Array<{ id: string; name: string; frequency: string }>
  logs: Array<{ habit_id: string; logged_at: string; completed: boolean }>
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function evaluateRules(snapshot: AISnapshot, habitData?: HabitData): TriggeredNotification[] {
  const notifications: TriggeredNotification[] = []
  const today = todayStr()

  // Rule 1: Tasks due within 3 days
  snapshot.tasks
    .filter(t => t.due_date && t.status !== 'done')
    .forEach(t => {
      const days = daysUntil(t.due_date!)
      if (days >= 0 && days <= 3) {
        const label = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`
        notifications.push({
          title: `Task due ${label}`,
          message: `"${t.title}" is due ${label}.`,
          dedupKey: `task-due-${t.title}-${today}`
        })
      }
    })

  // Rule 2: Overdue tasks
  const overdueTasks = snapshot.tasks.filter(t => t.due_date && t.status !== 'done' && daysUntil(t.due_date) < 0)
  if (overdueTasks.length > 0) {
    notifications.push({
      title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
      message: overdueTasks.map(t => t.title).join(', '),
      dedupKey: `overdue-tasks-${today}`
    })
  }

  // Rule 3: High stress streak (3+ consecutive entries with stress >= 7)
  if (snapshot.moods.length >= 3) {
    const recentMoods = snapshot.moods.slice(-3)
    const highStressStreak = recentMoods.every(m => (m.stress_score ?? 0) >= 7)
    if (highStressStreak) {
      notifications.push({
        title: 'High stress alert',
        message: 'Your stress has been elevated for your last 3 mood entries. Consider taking a break or doing something relaxing.',
        dedupKey: `high-stress-${today}`
      })
    }
  }

  // Rule 4: Goal deadline approaching (within 7 days)
  snapshot.goals
    .filter(g => g.target_date && g.status === 'active')
    .forEach(g => {
      const days = daysUntil(g.target_date!)
      if (days >= 0 && days <= 7) {
        notifications.push({
          title: 'Goal deadline approaching',
          message: `"${g.title}" target date is in ${days} day${days !== 1 ? 's' : ''}.`,
          dedupKey: `goal-deadline-${g.title}-${today}`
        })
      }
    })

  // Rule 5: Habit streak at risk (daily habit with no log yesterday)
  if (habitData) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    habitData.habits
      .filter(h => h.frequency === 'daily')
      .forEach(h => {
        const loggedYesterday = habitData.logs.some(
          l => l.habit_id === h.id && l.logged_at === yesterdayStr && l.completed
        )
        if (!loggedYesterday) {
          notifications.push({
            title: 'Habit streak at risk',
            message: `You missed "${h.name}" yesterday. Log it today to keep your streak!`,
            dedupKey: `habit-streak-${h.id}-${today}`
          })
        }
      })
  }

  return notifications
}
