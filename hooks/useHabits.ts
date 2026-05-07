import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'
import { maybeCompleteQuest } from '../lib/gamificationClient'
import type { Habit } from '../types/models'

export function useHabits() {
  const habits = useDataStore(s => s.habits)
  const habitLogs = useDataStore(s => s.habitLogs)
  const loading = useDataStore(s => s.habitsLoading)
  const loaded = useDataStore(s => s.habitsLoaded)
  const fetchHabits = useDataStore(s => s.fetchHabits)
  const toast = useToastStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded) fetchHabits()
  }, [loaded, fetchHabits])

  const addHabit = async (payload: Partial<Habit>) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('habits').insert({
        name: payload.name,
        frequency: payload.frequency ?? 'daily'
      }))
      await fetchHabits()
      toast.success('Habit created')
    } catch (err) {
      handleError(err, { fallback: 'Failed to create habit', setError, toast })
    }
  }

  const removeHabit = async (id: string) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('habits').delete().eq('id', id))
      await fetchHabits()
      toast.success('Habit deleted')
    } catch (err) {
      handleError(err, { fallback: 'Failed to delete habit', setError, toast })
    }
  }

  const toggleHabitLog = async (habitId: string, date: string) => {
    try {
      setError(null)
      const existing = habitLogs.find(l => l.habit_id === habitId && l.logged_at === date)
      if (existing) {
        await supabaseWithRetry(() => supabase.from('habit_logs').delete().eq('id', existing.id))
      } else {
        await supabaseWithRetry(() => supabase.from('habit_logs').insert({
          habit_id: habitId,
          logged_at: date,
          completed: true
        }))
        const reward = await maybeCompleteQuest({ sourceType: 'habit', linkedId: habitId })
        if (reward?.narrative) {
          toast.info(reward.narrative)
        }
      }
      await fetchHabits()
    } catch (err) {
      handleError(err, { fallback: 'Failed to update habit log', setError, toast })
    }
  }

  const getStreak = useCallback((habitId: string): number => {
    const logs = habitLogs
      .filter(l => l.habit_id === habitId && l.completed)
      .map(l => l.logged_at)
      .sort((a, b) => b.localeCompare(a))

    if (logs.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().slice(0, 10)
      if (logs.includes(dateStr)) {
        streak++
      } else if (i === 0) {
        continue // today hasn't been logged yet, still check yesterday
      } else {
        break
      }
    }
    return streak
  }, [habitLogs])

  const getCompletionMap = useCallback((habitId: string): Record<string, boolean> => {
    const map: Record<string, boolean> = {}
    habitLogs
      .filter(l => l.habit_id === habitId && l.completed)
      .forEach(l => { map[l.logged_at] = true })
    return map
  }, [habitLogs])

  return { habits, habitLogs, loading, error, addHabit, removeHabit, toggleHabitLog, getStreak, getCompletionMap }
}

export default useHabits

