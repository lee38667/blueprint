import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useConfirm } from '../../hooks/useConfirm'
import { useGym } from '../../hooks/useGym'
import { CardSkeleton } from '../../components/Skeleton'
import { exportWorkoutLogsToCSV } from '../../lib/csvExport'
import MuscleMap from '../../components/MuscleMap'
import {
  aggregateMuscleActivity,
  muscleStatus,
  underTrainedMuscles,
  musclesForExercise,
  MUSCLES,
  ALL_MUSCLE_KEYS,
  type MuscleKey,
  type MuscleStatus,
} from '../../lib/muscles'
import { useMemo, useState } from 'react'

type ExerciseSet = { reps: number; weight: number }
type Exercise = { name: string; sets: ExerciseSet[] }
type StructuredMetrics = { exercises: Exercise[]; duration_min?: number }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BLANK_EXERCISE: Exercise = { name: '', sets: [{ reps: 10, weight: 0 }] }

function parseMetrics(raw: any): StructuredMetrics {
  if (!raw || typeof raw !== 'object') return { exercises: [] }
  if (Array.isArray(raw.exercises)) return raw as StructuredMetrics
  // legacy free-form JSON — preserve as a single labelled exercise
  return { exercises: [] }
}

function totalVolume(log: any): number {
  const m = parseMetrics(log.metrics)
  return m.exercises.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + (set.reps * set.weight), 0), 0)
}

function setCount(log: any): number {
  const m = parseMetrics(log.metrics)
  return m.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
}

export default function GymPage() {
  const { workouts, logs, loading, error, addWorkout, addLog, updateWorkout, deleteWorkout, deleteLog } = useGym()
  const { confirm, confirmDialog } = useConfirm()

  // Create / edit workout template
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null)
  const [wfName, setWfName] = useState('')
  const [wfDay, setWfDay] = useState('')
  const [wfNotes, setWfNotes] = useState('')

  // Log a session
  const [logOpenFor, setLogOpenFor] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([{ ...BLANK_EXERCISE, sets: [{ reps: 10, weight: 0 }] }])
  const [duration, setDuration] = useState('')
  const [logNotes, setLogNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // History expansion
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null)

  // Muscle map
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleKey | null>(null)

  const stats = useMemo(() => {
    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    const weekLogs = logs.filter((l) => new Date(l.performed_at).getTime() >= weekAgo)
    const totalVol = weekLogs.reduce((s, l) => s + totalVolume(l), 0)
    const totalSets = weekLogs.reduce((s, l) => s + setCount(l), 0)
    // Personal records: best weight per exercise name across all time
    const prs = new Map<string, number>()
    for (const l of logs) {
      for (const ex of parseMetrics(l.metrics).exercises) {
        for (const set of ex.sets) {
          const key = ex.name.trim().toLowerCase()
          if (!key) continue
          prs.set(key, Math.max(prs.get(key) ?? 0, set.weight))
        }
      }
    }
    return { totalVol, totalSets, weekSessions: weekLogs.length, prs }
  }, [logs])

  // Flatten logged exercises → per-muscle activity, recovery status, coverage gaps.
  const muscle = useMemo(() => {
    const now = Date.now()
    const flat = logs.flatMap((l) =>
      parseMetrics(l.metrics).exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets.length,
        performedAt: l.performed_at,
      }))
    )
    const activity = aggregateMuscleActivity(flat, now, 7)
    const statusByMuscle = {} as Record<MuscleKey, MuscleStatus>
    const setsByMuscle = {} as Record<MuscleKey, number>
    for (const key of ALL_MUSCLE_KEYS) {
      statusByMuscle[key] = muscleStatus(key, activity[key])
      setsByMuscle[key] = activity[key].sets
    }
    const gaps = underTrainedMuscles(activity).slice(0, 4)
    // Exercises in history that train the currently-selected muscle.
    const hits = selectedMuscle
      ? Array.from(
          new Set(
            flat
              .filter((e) => {
                const m = musclesForExercise(e.name)
                return m.primary.includes(selectedMuscle) || m.secondary.includes(selectedMuscle)
              })
              .map((e) => e.name)
          )
        ).slice(0, 6)
      : []
    const trainedCount = ALL_MUSCLE_KEYS.filter((k) => activity[k].lastTrained !== null).length
    return { statusByMuscle, setsByMuscle, gaps, hits, trainedCount }
  }, [logs, selectedMuscle])

  const resetWorkoutForm = () => {
    setEditingWorkoutId(null)
    setWfName('')
    setWfDay('')
    setWfNotes('')
  }

  const handleSaveWorkout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!wfName.trim()) return
    const payload = { name: wfName.trim(), day: wfDay || null, notes: wfNotes || null }
    if (editingWorkoutId) {
      await updateWorkout(editingWorkoutId, payload)
    } else {
      await addWorkout(payload)
    }
    resetWorkoutForm()
  }

  const startEditWorkout = (w: any) => {
    setEditingWorkoutId(w.id)
    setWfName(w.name || '')
    setWfDay(w.day || '')
    setWfNotes(w.notes || '')
  }

  const handleDeleteWorkout = async (w: any) => {
    const ok = await confirm({
      title: `Delete ${w.name}?`,
      message: 'All logged sessions for this workout will also be deleted.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (ok) await deleteWorkout(w.id)
  }

  const openLogModal = (workoutId: string) => {
    setLogOpenFor(workoutId)
    setExercises([{ name: '', sets: [{ reps: 10, weight: 0 }] }])
    setDuration('')
    setLogNotes('')
  }

  const addExercise = () => setExercises((cur) => [...cur, { name: '', sets: [{ reps: 10, weight: 0 }] }])
  const removeExercise = (i: number) => setExercises((cur) => cur.filter((_, idx) => idx !== i))
  const updateExerciseName = (i: number, name: string) =>
    setExercises((cur) => cur.map((ex, idx) => (idx === i ? { ...ex, name } : ex)))
  const addSet = (i: number) =>
    setExercises((cur) => cur.map((ex, idx) => {
      if (idx !== i) return ex
      const last = ex.sets[ex.sets.length - 1] ?? { reps: 10, weight: 0 }
      return { ...ex, sets: [...ex.sets, { ...last }] }
    }))
  const removeSet = (i: number, j: number) =>
    setExercises((cur) => cur.map((ex, idx) => (idx === i ? { ...ex, sets: ex.sets.filter((_, sIdx) => sIdx !== j) } : ex)))
  const updateSet = (i: number, j: number, field: 'reps' | 'weight', value: string) =>
    setExercises((cur) => cur.map((ex, idx) => {
      if (idx !== i) return ex
      const sets = ex.sets.map((s, sIdx) => sIdx === j ? { ...s, [field]: parseFloat(value) || 0 } : s)
      return { ...ex, sets }
    }))

  const handleSubmitLog = async () => {
    if (!logOpenFor) return
    const filtered = exercises
      .map((ex) => ({ ...ex, name: ex.name.trim() }))
      .filter((ex) => ex.name && ex.sets.length > 0)
    if (filtered.length === 0) return
    setSubmitting(true)
    const metrics: StructuredMetrics = {
      exercises: filtered,
      ...(duration ? { duration_min: parseFloat(duration) } : {}),
    }
    await addLog(logOpenFor, { metrics, notes: logNotes || null })
    setSubmitting(false)
    setLogOpenFor(null)
  }

  const handleDeleteLog = async (logId: string) => {
    const ok = await confirm({
      title: 'Delete session?',
      message: 'Remove this logged workout session?',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (ok) await deleteLog(logId)
  }

  const accent = 'var(--theme-accent)'

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 py-4">
        <ConfirmDialog {...confirmDialog} />

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="heading-xl">Training</h1>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              Plan workouts, log structured sets, watch your volume climb.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button variant="outline" size="sm" onClick={() => exportWorkoutLogsToCSV(logs, workouts)} disabled={logs.length === 0}>Export CSV</Button>
          </div>
        </header>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Sessions this week', value: stats.weekSessions },
            { label: 'Sets this week', value: stats.totalSets },
            { label: 'Volume (week)', value: `${Math.round(stats.totalVol).toLocaleString()}` },
            { label: 'Tracked exercises', value: stats.prs.size },
          ].map((s) => (
            <div key={s.label} className="panel-glass rounded-2xl p-4">
              <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</div>
              <div className="text-2xl font-semibold mt-1" style={{ color: 'var(--theme-text)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Muscle coverage & recovery */}
        <Card
          title="Muscle Coverage & Recovery"
          subtitle={`${muscle.trainedCount}/${ALL_MUSCLE_KEYS.length} muscle groups trained · colored by recovery from your logged sets`}
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
            <MuscleMap
              statusByMuscle={muscle.statusByMuscle}
              setsByMuscle={muscle.setsByMuscle}
              selected={selectedMuscle}
              onSelect={setSelectedMuscle}
            />

            <div className="space-y-4">
              {selectedMuscle ? (
                <div className="rounded-xl p-4" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{MUSCLES[selectedMuscle].label}</h3>
                    <button onClick={() => setSelectedMuscle(null)} className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>clear</button>
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                    {Math.round(muscle.setsByMuscle[selectedMuscle] * 10) / 10} effective sets this week (target {MUSCLES[selectedMuscle].weeklySetTarget}).
                  </p>
                  {muscle.hits.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {muscle.hits.map((name) => (
                        <span key={name} className="badge text-[11px]">{name}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      No logged exercise has hit this muscle yet.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl p-4" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>How it works</p>
                  <p className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>
                    Every set you log is mapped to the muscles it trains. Green is recovered and ready, yellow is mid-recovery, red was just worked.
                  </p>
                </div>
              )}

              <div className="rounded-xl p-4" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>Train next — biggest gaps</p>
                {muscle.gaps.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>Great balance — every group is near its weekly target.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {muscle.gaps.map((g) => (
                      <li key={g.key} className="flex items-center justify-between text-sm">
                        <button
                          className="text-left hover:underline"
                          style={{ color: 'var(--theme-text)' }}
                          onClick={() => setSelectedMuscle(g.key)}
                        >
                          {MUSCLES[g.key].label}
                        </button>
                        <span className="font-mono text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                          {Math.round(g.sets * 10) / 10}/{g.target} sets
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Workout template form */}
        <Card title={editingWorkoutId ? 'Edit Workout' : 'New Workout'} subtitle="A reusable template you can log sessions against.">
          <form onSubmit={handleSaveWorkout} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-5">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Name</label>
              <input value={wfName} onChange={(e) => setWfName(e.target.value)} placeholder="Push Day" className="input-base w-full" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Day</label>
              <select value={wfDay} onChange={(e) => setWfDay(e.target.value)} className="input-base w-full">
                <option value="">Any day</option>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="md:col-span-4 flex gap-2 justify-end">
              {editingWorkoutId && <Button type="button" variant="outline" onClick={resetWorkoutForm}>Cancel</Button>}
              <Button type="submit" variant="primary">{editingWorkoutId ? 'Save' : 'Create'}</Button>
            </div>
            <div className="md:col-span-12">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Notes</label>
              <textarea value={wfNotes} onChange={(e) => setWfNotes(e.target.value)} rows={2} placeholder="Equipment, supersets, focus..." className="input-base w-full" />
            </div>
          </form>
        </Card>

        {/* Workouts list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            <Card><CardSkeleton className="h-24" /></Card>
          ) : workouts.length === 0 ? (
            <Card><p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No workouts yet. Create one above.</p></Card>
          ) : (
            workouts.map((w) => {
              const workoutLogs = logs.filter((l) => l.workout_id === w.id)
              const lastLog = workoutLogs[0]
              const totalVolThisWorkout = workoutLogs.reduce((s, l) => s + totalVolume(l), 0)
              const expanded = expandedWorkout === w.id
              return (
                <div key={w.id} className="panel-glass rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--theme-text)' }}>{w.name}</h3>
                        {w.day && (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--theme-surface)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                            {w.day}
                          </span>
                        )}
                      </div>
                      {w.notes && <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>{w.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Total volume</div>
                      <div className="text-base font-mono" style={{ color: accent }}>{Math.round(totalVolThisWorkout).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs"
                    style={{ borderTop: '1px solid var(--theme-border)', borderBottom: '1px solid var(--theme-border)' }}>
                    <div className="py-2">
                      <div style={{ color: 'var(--theme-text-muted)' }}>Sessions</div>
                      <div className="font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>{workoutLogs.length}</div>
                    </div>
                    <div className="py-2" style={{ borderLeft: '1px solid var(--theme-border)', borderRight: '1px solid var(--theme-border)' }}>
                      <div style={{ color: 'var(--theme-text-muted)' }}>Last</div>
                      <div className="font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>
                        {lastLog ? new Date(lastLog.performed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                      </div>
                    </div>
                    <div className="py-2">
                      <div style={{ color: 'var(--theme-text-muted)' }}>Sets</div>
                      <div className="font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>
                        {workoutLogs.reduce((s, l) => s + setCount(l), 0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="primary" onClick={() => openLogModal(w.id)}>Log session</Button>
                    <Button size="sm" variant="outline" onClick={() => setExpandedWorkout(expanded ? null : w.id)}>
                      {expanded ? 'Hide history' : `History (${workoutLogs.length})`}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => startEditWorkout(w)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteWorkout(w)}>Delete</Button>
                  </div>

                  {expanded && (
                    <div className="space-y-2">
                      {workoutLogs.length === 0 && (
                        <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>No sessions yet.</p>
                      )}
                      {workoutLogs.slice(0, 8).map((log) => {
                        const m = parseMetrics(log.metrics)
                        const vol = totalVolume(log)
                        return (
                          <div key={log.id} className="rounded-lg p-3 text-xs"
                            style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div style={{ color: 'var(--theme-text-dim)' }}>
                                {new Date(log.performed_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono" style={{ color: accent }}>vol {Math.round(vol).toLocaleString()}</span>
                                <button onClick={() => handleDeleteLog(log.id)} className="text-red-400 hover:underline">remove</button>
                              </div>
                            </div>
                            {m.exercises.length > 0 ? (
                              <div className="space-y-1.5">
                                {m.exercises.map((ex, exIdx) => (
                                  <div key={exIdx} className="flex items-center justify-between gap-2">
                                    <span className="font-medium" style={{ color: 'var(--theme-text)' }}>{ex.name}</span>
                                    <span className="font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                                      {ex.sets.map((s) => `${s.reps}×${s.weight}`).join(' · ')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ color: 'var(--theme-text-muted)' }}>Free-form session{log.notes ? '' : ' — no detail recorded'}.</p>
                            )}
                            {log.notes && <p className="mt-2" style={{ color: 'var(--theme-text-muted)' }}>{log.notes}</p>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* PRs */}
        {stats.prs.size > 0 && (
          <Card title="Personal Records" subtitle="Heaviest weight logged per exercise.">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Array.from(stats.prs.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([name, weight]) => (
                  <div key={name} className="rounded-lg px-3 py-2"
                    style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                    <div className="text-xs capitalize truncate" style={{ color: 'var(--theme-text-muted)' }}>{name}</div>
                    <div className="font-mono text-base" style={{ color: accent }}>{weight}</div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Log session modal */}
        {logOpenFor && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/70" onClick={() => setLogOpenFor(null)} />
            <div className="relative z-10 w-full md:max-w-2xl max-h-[90vh] overflow-y-auto panel-glass rounded-t-2xl md:rounded-2xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
                    Log: {workouts.find((w) => w.id === logOpenFor)?.name}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Add exercises and the sets you actually completed.</p>
                </div>
                <button onClick={() => setLogOpenFor(null)} className="text-xs px-2 py-1 rounded" style={{ border: '1px solid var(--theme-border)' }}>Close</button>
              </div>

              <div className="space-y-4">
                {exercises.map((ex, i) => (
                  <div key={i} className="rounded-xl p-3"
                    style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        value={ex.name}
                        onChange={(e) => updateExerciseName(i, e.target.value)}
                        placeholder="Exercise name (e.g., Bench Press)"
                        className="input-base flex-1"
                      />
                      {exercises.length > 1 && (
                        <button onClick={() => removeExercise(i)} className="text-xs px-2 py-1 rounded text-red-400"
                          style={{ border: '1px solid var(--theme-border)' }}>Remove</button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-[24px_1fr_1fr_28px] gap-2 text-[10px] uppercase tracking-wider"
                        style={{ color: 'var(--theme-text-muted)' }}>
                        <span>#</span><span>Reps</span><span>Weight</span><span></span>
                      </div>
                      {ex.sets.map((set, j) => (
                        <div key={j} className="grid grid-cols-[24px_1fr_1fr_28px] gap-2 items-center">
                          <span className="text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>{j + 1}</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.reps}
                            onChange={(e) => updateSet(i, j, 'reps', e.target.value)}
                            className="input-base"
                          />
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            value={set.weight}
                            onChange={(e) => updateSet(i, j, 'weight', e.target.value)}
                            className="input-base"
                          />
                          <button
                            onClick={() => removeSet(i, j)}
                            disabled={ex.sets.length <= 1}
                            className="text-xs h-8 w-7 rounded disabled:opacity-30"
                            style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
                            aria-label="Remove set"
                          >×</button>
                        </div>
                      ))}
                      <button
                        onClick={() => addSet(i)}
                        className="w-full text-xs py-1.5 rounded-lg"
                        style={{ border: '1px dashed var(--theme-border)', color: 'var(--theme-text-muted)' }}
                      >+ Add set</button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addExercise}
                  className="w-full text-sm py-2 rounded-xl"
                  style={{ border: '1px dashed var(--theme-border)', color: 'var(--theme-text-muted)' }}
                >+ Add exercise</button>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Duration (min)</label>
                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="input-base w-full" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Session notes</label>
                    <input value={logNotes} onChange={(e) => setLogNotes(e.target.value)} placeholder="How did it feel?" className="input-base w-full" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setLogOpenFor(null)}>Cancel</Button>
                  <Button variant="primary" loading={submitting} onClick={handleSubmitLog}>Save Session</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
