import { useEffect, useMemo, useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useGoals } from '../hooks/useGoals'
import { useHabits } from '../hooks/useHabits'
import useMoodLogs from '../hooks/useMoodLogs'
import { useNotifications } from '../hooks/useNotifications'
import { useToastStore } from '../lib/toastStore'

const STORAGE_KEY = 'blueprint-agent-presence-nudges'

interface Nudge {
  key: string
  title: string
  message: string
}

function readFiredKeys(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[]
  } catch {
    return []
  }
}

function markFired(key: string) {
  if (typeof window === 'undefined') return
  const next = Array.from(new Set([...readFiredKeys(), key])).slice(-50)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function startOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function isSameDay(dateStr: string) {
  const date = new Date(dateStr)
  const today = startOfToday()
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
}

function slotOfDay(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 22) return 'evening'
  return 'night'
}

export default function SystemPresence() {
  const { tasks } = useTasks()
  const { goals } = useGoals()
  const { habits, habitLogs } = useHabits()
  const { logs: moodLogs } = useMoodLogs()
  const { addNotification } = useNotifications()
  const toast = useToastStore()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  const nudge = useMemo<Nudge | null>(() => {
    const slot = slotOfDay(now)
    const todayKey = now.toISOString().slice(0, 10)
    const overdueTask = tasks.find((task) => task.status !== 'done' && task.due_date && new Date(task.due_date) < startOfToday())
    if (overdueTask) {
      return {
        key: `overdue-${todayKey}`,
        title: 'Blueprint AI: overdue task',
        message: `"${overdueTask.title}" is still open. Clear one tiny piece now to lower the pressure curve.`,
      }
    }

    const todayPriorityTask = tasks.find((task) => task.status !== 'done' && task.priority === 'high' && task.due_date && isSameDay(task.due_date))
    if (todayPriorityTask && slot === 'morning') {
      return {
        key: `morning-priority-${todayKey}`,
        title: 'Blueprint AI: morning focus',
        message: `It is a good morning window to start "${todayPriorityTask.title}" before the day fragments.`,
      }
    }

    const latestMood = moodLogs[moodLogs.length - 1]
    if (latestMood && (latestMood.stress_score ?? 0) >= 7 && slot === 'afternoon') {
      return {
        key: `stress-afternoon-${todayKey}`,
        title: 'Blueprint AI: recovery nudge',
        message: 'Your recent stress is elevated. Take a short reset before starting another hard task.',
      }
    }

    const soonGoal = goals.find((goal) => goal.status === 'active' && goal.target_date)
    if (soonGoal && slot === 'evening') {
      const daysLeft = Math.ceil((new Date(soonGoal.target_date!).getTime() - startOfToday().getTime()) / 86400000)
      if (daysLeft >= 0 && daysLeft <= 3) {
        return {
          key: `goal-evening-${soonGoal.id}-${todayKey}`,
          title: 'Blueprint AI: goal pulse',
          message: `"${soonGoal.title}" is getting close. A five-minute check-in tonight will protect momentum.`,
        }
      }
    }

    const yesterday = new Date(startOfToday())
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)
    const atRiskHabit = habits.find((habit) => habit.frequency === 'daily' && !habitLogs.some((log) => log.habit_id === habit.id && log.completed && log.logged_at === yesterdayStr))
    if (atRiskHabit && slot === 'evening') {
      return {
        key: `habit-evening-${atRiskHabit.id}-${todayKey}`,
        title: 'Blueprint AI: streak watch',
        message: `Your "${atRiskHabit.name}" streak is wobbling. One quick log tonight keeps the chain alive.`,
      }
    }

    return null
  }, [goals, habitLogs, habits, moodLogs, now, tasks])

  useEffect(() => {
    if (!nudge) return
    if (readFiredKeys().includes(nudge.key)) return

    markFired(nudge.key)
    toast.info(nudge.message)
    void addNotification({ title: nudge.title, message: nudge.message, due_at: new Date().toISOString(), status: 'pending' }, { silent: true })

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(nudge.title, { body: nudge.message, tag: nudge.key })
    }

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([30, 24, 30])
    }
  }, [addNotification, nudge, toast])

  return null
}
