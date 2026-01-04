import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useGym } from '../../hooks/useGym'
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
      notes: workoutNotes || null
    })
    setWorkoutName('')
    setWorkoutDay('')
    setWorkoutNotes('')
  }

  const handleLogWorkout = async () => {
    if (!selectedWorkout) return
    await addLog(selectedWorkout, {
      metrics: metrics ? (() => { try { return JSON.parse(metrics) } catch { return null } })() : null,
      notes: logNotes || null
    })
    setMetrics('')
    setLogNotes('')
    setSelectedWorkout('')
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-display font-bold">Gym Workouts</h1>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>

          <Card title="Create Workout">
            <form onSubmit={handleAddWorkout} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Workout Name</label>
                <input
                  value={workoutName}
                  onChange={e => setWorkoutName(e.target.value)}
                  placeholder="e.g., Chest Day"
                  className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Day</label>
                <input
                  value={workoutDay}
                  onChange={e => setWorkoutDay(e.target.value)}
                  placeholder="e.g., Monday"
                  className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
                />
              </div>
              <Button variant="primary" className="text-xs w-full md:w-auto">Create</Button>
            </form>
            <div className="mt-3">
              <label className="block text-xs text-gray-400 mb-1">Notes</label>
              <textarea
                value={workoutNotes}
                onChange={e => setWorkoutNotes(e.target.value)}
                placeholder="Workout description, equipment, etc."
                rows={2}
                className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
              />
            </div>
          </Card>

          <Card title="Log Workout">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Select Workout</label>
                <select value={selectedWorkout} onChange={e => setSelectedWorkout(e.target.value)} className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm">
                  <option value="">Choose a workout</option>
                  {workouts.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Metrics (JSON)</label>
                <input
                  value={metrics}
                  onChange={e => setMetrics(e.target.value)}
                  placeholder='{"reps": 10}'
                  className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm text-xs outline-none focus:border-electric"
                />
              </div>
              <Button onClick={handleLogWorkout} variant="primary" className="text-xs w-full md:w-auto">Log</Button>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-400 mb-1">Notes</label>
              <textarea
                value={logNotes}
                onChange={e => setLogNotes(e.target.value)}
                placeholder="How did it feel?"
                rows={2}
                className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
              />
            </div>
          </Card>

          <Card title="Workouts">
            <div className="space-y-3">
              {loading ? (
                <div className="card-skeleton h-20" />
              ) : workouts.length === 0 ? (
                <p className="text-sm text-neutral-500">No workouts yet. Create one above.</p>
              ) : (
                workouts.map(w => (
                  <div key={w.id} className="p-3 rounded border border-white/10 bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{w.name}</p>
                        <p className="text-xs text-neutral-500">{w.day || 'No day'}</p>
                        {w.notes && <p className="text-xs text-neutral-400 mt-1">{w.notes}</p>}
                      </div>
                      <span className="text-xs bg-white/10 px-2 py-1 rounded">{logs.filter(l => l.workout_id === w.id).length} logs</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Recent Logs">
            <div className="space-y-2">
              {logs.slice(-10).map(log => (
                <div key={log.id} className="text-xs p-2 rounded bg-white/5 border border-white/10">
                  <p className="text-neutral-300">{new Date(log.performed_at).toLocaleDateString()}</p>
                  {log.notes && <p className="text-neutral-500">{log.notes}</p>}
                </div>
              ))}
              {logs.length === 0 && <p className="text-xs text-neutral-500">No logs yet.</p>}
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
