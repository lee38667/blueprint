import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useHabits } from '../../hooks/useHabits'
import { useConfirm } from '../../hooks/useConfirm'
import { CardSkeleton } from '../../components/Skeleton'
import { useState, useMemo } from 'react'

export default function HabitsPage() {
  const { habits, loading, error, addHabit, removeHabit, toggleHabitLog, getStreak, getCompletionMap } = useHabits()
  const { confirm, confirmDialog } = useConfirm()
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')

  const today = new Date().toISOString().slice(0, 10)

  const heatmapDays = useMemo(() => {
    const days: string[] = []
    const now = new Date()
    for (let i = 34; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    return days
  }, [])

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return
    await addHabit({ name, frequency })
    setName('')
    setFrequency('daily')
  }

  const handleDelete = async (id: string, habitName: string) => {
    const confirmed = await confirm({
      title: 'Delete Habit?',
      message: `Are you sure you want to delete "${habitName}"? All logged data will be lost.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    })
    if (confirmed) {
      await removeHabit(id)
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        <ConfirmDialog {...confirmDialog} />
        <div>
          <h1 className="heading-xl">Habits</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Build consistency with daily and weekly habit tracking.
          </p>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        <Card title="New Habit">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Habit Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Drink 8 glasses of water"
                className="input-base w-full"
              />
            </div>
            <div className="sm:w-36 w-full">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className="input-base w-full">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <Button variant="primary" className="text-xs w-full sm:w-auto" type="submit">Add Habit</Button>
          </form>
        </Card>

        {loading ? (
          <Card><CardSkeleton className="h-32" /></Card>
        ) : habits.length === 0 ? (
          <Card>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              No habits yet. Create one above to start tracking.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => {
              const streak = getStreak(habit.id)
              const completionMap = getCompletionMap(habit.id)
              const isDoneToday = !!completionMap[today]

              return (
                <Card key={habit.id}>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleHabitLog(habit.id, today)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: isDoneToday ? 'var(--theme-accent)' : 'var(--theme-surface)',
                            border: `2px solid ${isDoneToday ? 'var(--theme-accent)' : 'var(--theme-border)'}`,
                            color: isDoneToday ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
                          }}
                        >
                          {isDoneToday ? '\u2713' : ''}
                        </button>
                        <div>
                          <h3 className="font-medium text-sm" style={{ color: 'var(--theme-text)' }}>{habit.name}</h3>
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                            <span className="badge">{habit.frequency}</span>
                            {streak > 0 && (
                              <span style={{ color: 'var(--theme-accent)' }}>
                                {streak} day streak
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(habit.id, habit.name)}
                        className="text-xs px-2 py-1 rounded border border-red-900/50 text-red-400 hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Heatmap */}
                    <div>
                      <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                        Last 35 days
                      </p>
                      <div className="grid grid-cols-7 gap-1">
                        {heatmapDays.map((day) => (
                          <button
                            key={day}
                            onClick={() => toggleHabitLog(habit.id, day)}
                            title={day}
                            className="aspect-square rounded-sm transition-colors"
                            style={{
                              background: completionMap[day]
                                ? 'var(--theme-accent)'
                                : 'var(--theme-surface)',
                              border: '1px solid var(--theme-border)',
                              opacity: completionMap[day] ? 1 : 0.4,
                              minWidth: 0,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
