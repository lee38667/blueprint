import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useGym } from '../../hooks/useGym'
import { CardSkeleton } from '../../components/Skeleton'
import { useState } from 'react'

export default function GymPage() {
  const { workouts, logs, loading, error, addWorkout, addLog } = useGym()
  const [workoutName, setWorkoutName] = useState('')
  const [workoutDay, setWorkoutDay] = useState('')
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [selectedWorkout, setSelectedWorkout] = useState<string>('')
  const [metrics, setMetrics] = useState('')
  const [logNotes, setLogNotes] = useState('')

  const handleAddWorkout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!workoutName) return
    await addWorkout({
      name: workoutName,
      day: workoutDay || null,
      notes: workoutNotes || null,
    })
    setWorkoutName('')
    setWorkoutDay('')
    setWorkoutNotes('')
  }

  const handleLogWorkout = async () => {
    if (!selectedWorkout) return
    await addLog(selectedWorkout, {
      metrics: metrics ? (() => { try { return JSON.parse(metrics) } catch { return null } })() : null,
      notes: logNotes || null,
    })
    setMetrics('')
    setLogNotes('')
    setSelectedWorkout('')
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        <div>
          <h1 className="heading-xl">Gym Workouts</h1>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        <Card title="Create Workout">
          <form onSubmit={handleAddWorkout} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Workout Name</label>
              <input value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} placeholder="e.g., Chest Day" className="input-base w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Day</label>
              <input value={workoutDay} onChange={(e) => setWorkoutDay(e.target.value)} placeholder="e.g., Monday" className="input-base w-full" />
            </div>
            <Button variant="primary" className="text-xs w-full md:w-auto" type="submit">Create</Button>
          </form>
          <div className="mt-3">
            <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Notes</label>
            <textarea value={workoutNotes} onChange={(e) => setWorkoutNotes(e.target.value)} placeholder="Workout description, equipment, etc." rows={2} className="input-base w-full" />
          </div>
        </Card>

        <Card title="Log Workout">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Select Workout</label>
              <select value={selectedWorkout} onChange={(e) => setSelectedWorkout(e.target.value)} className="input-base w-full">
                <option value="">Choose a workout</option>
                {workouts.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Metrics (JSON)</label>
              <input value={metrics} onChange={(e) => setMetrics(e.target.value)} placeholder='{"reps": 10}' className="input-base w-full" />
            </div>
            <Button onClick={handleLogWorkout} variant="primary" className="text-xs w-full md:w-auto">Log</Button>
          </div>
          <div className="mt-3">
            <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Notes</label>
            <textarea value={logNotes} onChange={(e) => setLogNotes(e.target.value)} placeholder="How did it feel?" rows={2} className="input-base w-full" />
          </div>
        </Card>

        <Card title="Workouts">
          <div className="space-y-3">
            {loading ? (
              <CardSkeleton className="h-20" />
            ) : workouts.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No workouts yet. Create one above.</p>
            ) : (
              workouts.map((w) => (
                <div key={w.id} className="p-3 rounded-lg" style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{w.name}</p>
                      <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{w.day || 'No day'}</p>
                      {w.notes && <p className="text-xs mt-1" style={{ color: 'var(--theme-text-dim)' }}>{w.notes}</p>}
                    </div>
                    <span className="text-xs px-2 py-1 rounded badge">{logs.filter((l) => l.workout_id === w.id).length} logs</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Recent Logs">
          <div className="space-y-2">
            {logs.slice(-10).map((log) => (
              <div key={log.id} className="text-xs p-2 rounded" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                <p style={{ color: 'var(--theme-text-dim)' }}>{new Date(log.performed_at).toLocaleDateString()}</p>
                {log.notes && <p style={{ color: 'var(--theme-text-muted)' }}>{log.notes}</p>}
              </div>
            ))}
            {logs.length === 0 && <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>No logs yet.</p>}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
