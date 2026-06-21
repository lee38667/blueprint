import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import AICopilotInsightsCard from '../../components/AICopilotInsightsCard'
import ChartComponent from '../../components/Chart'
import RewardBurst from '../../components/RewardBurst'
import VoiceInputButton from '../../components/VoiceInputButton'
import { CardSkeleton } from '../../components/Skeleton'
import { useTasks } from '../../hooks/useTasks'
import { useGoals } from '../../hooks/useGoals'
import { useHabits } from '../../hooks/useHabits'
import useMoodLogs from '../../hooks/useMoodLogs'
import useBodyStats from '../../hooks/useBodyStats'
import useProductivityAnalytics from '../../hooks/useProductivityAnalytics'
import { useConfirm } from '../../hooks/useConfirm'
import { useInfiniteList } from '../../hooks/useInfiniteList'
import { useMotivationBoard } from '../../hooks/useMotivationBoard'
import { useToastStore } from '../../lib/toastStore'
import { exportTasksToCSV } from '../../lib/csvExport'
import {
  generateMicroSteps,
  getAchievementBadges,
  getAttentionIntervention,
  getEnergyProfile,
  getRewardMessage,
} from '../../lib/focusEngine'

const MICRO_STORAGE_KEY = 'blueprint-task-micro-steps'

type MicroState = Record<string, { done: string[]; active: string | null }>

function readMicroState(): MicroState {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(MICRO_STORAGE_KEY) || '{}') as MicroState
  } catch {
    return {}
  }
}

function priorityStyle(priority: 'low' | 'normal' | 'high') {
  if (priority === 'high') {
    return { background: 'rgba(239, 68, 68, 0.16)', color: '#fecaca', border: '1px solid rgba(239, 68, 68, 0.35)' }
  }
  if (priority === 'low') {
    return { background: 'rgba(20, 184, 166, 0.16)', color: '#99f6e4', border: '1px solid rgba(20, 184, 166, 0.35)' }
  }
  return { background: 'rgba(56, 189, 248, 0.16)', color: '#bae6fd', border: '1px solid rgba(56, 189, 248, 0.35)' }
}

export default function TasksPage() {
  const { tasks, loading, addTask, updateTask, removeTask } = useTasks()
  const { goals } = useGoals()
  const { habits, getStreak } = useHabits()
  const { logs: moodLogs } = useMoodLogs()
  const { stats } = useBodyStats()
  const { items: motivationItems } = useMotivationBoard()
  const toast = useToastStore()
  const { confirm, confirmDialog } = useConfirm()
  const analytics = useProductivityAnalytics(tasks)

  const [title, setTitle] = useState('')
  const [goalId, setGoalId] = useState('')
  const [status, setStatus] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')
  const [priority, setPriority] = useState<'all' | 'low' | 'normal' | 'high'>('all')
  const [project, setProject] = useState<string>('all')
  const [microState, setMicroState] = useState<MicroState>(readMicroState)
  const [rewardTrigger, setRewardTrigger] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(MICRO_STORAGE_KEY, JSON.stringify(microState))
  }, [microState])

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (status !== 'all' && task.status !== status) return false
      if (priority !== 'all' && task.priority !== priority) return false
      if (project !== 'all' && task.project !== project) return false
      return true
    })
  }, [priority, project, status, tasks])

  const infinite = useInfiniteList({ items: filtered, initialCount: 8, increment: 6 })
  const weeklySummary = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recent = tasks.filter((task) => new Date(task.created_at).getTime() >= weekAgo)
    return {
      created: recent.length,
      completed: tasks.filter((task) => task.status === 'done').length,
      inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    }
  }, [tasks])

  const snapshot = useMemo(() => ({
    tasks: tasks.map((task) => ({
      title: task.title,
      status: task.status,
      priority: task.priority,
      project: task.project,
      due_date: task.due_date,
      goal_id: task.goal_id,
    })),
    goals: goals.map((goal) => ({
      title: goal.title,
      status: goal.status,
      target_date: goal.target_date,
    })),
    moods: moodLogs,
    bodyStats: stats,
    finance: undefined,
    notes: [],
    habits: habits.map((habit) => ({
      name: habit.name,
      frequency: habit.frequency,
      currentStreak: getStreak(habit.id),
    })),
  }), [goals, habits, moodLogs, stats, tasks, getStreak])

  const energy = useMemo(() => getEnergyProfile(snapshot), [snapshot])
  const attention = useMemo(() => getAttentionIntervention(snapshot), [snapshot])
  const badges = useMemo(() => getAchievementBadges(snapshot), [snapshot])
  const rewardMessage = useMemo(() => getRewardMessage(motivationItems), [motivationItems])

  const handleAdd = async () => {
    if (!title.trim()) return
    await addTask({ title, goal_id: goalId || null })
    setTitle('')
    setGoalId('')
  }

  const celebrate = (taskTitle: string) => {
    setRewardTrigger(Date.now())
    toast.success(`Completed: ${taskTitle}`)
    toast.info(rewardMessage)
  }

  const handleDelete = async (taskId: string, taskTitle: string) => {
    const confirmed = await confirm({
      title: 'Delete Task?',
      message: `Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    })

    if (confirmed) {
      await removeTask(taskId)
    }
  }

  const getTaskMicroState = (taskId: string) => microState[taskId] ?? { done: [], active: null }

  const startMicroStep = async (taskId: string, stepId: string) => {
    setMicroState((current) => ({
      ...current,
      [taskId]: {
        ...getTaskMicroState(taskId),
        active: stepId,
      },
    }))

    const task = tasks.find((item) => item.id === taskId)
    if (task && task.status === 'todo') {
      await updateTask(taskId, { status: 'in_progress' })
    }
  }

  const completeMicroStep = async (taskId: string, taskTitle: string, stepId: string, totalSteps: number) => {
    const currentState = getTaskMicroState(taskId)
    const done = currentState.done.includes(stepId) ? currentState.done : [...currentState.done, stepId]
    setMicroState((current) => ({
      ...current,
      [taskId]: {
        done,
        active: currentState.active === stepId ? null : currentState.active,
      },
    }))

    if (done.length >= totalSteps) {
      await updateTask(taskId, { status: 'done' })
      celebrate(taskTitle)
    }
  }

  const handleVoiceTask = (transcript: string) => {
    setTitle((current) => `${current} ${transcript}`.trim())
  }

  const priorityTotal = Math.max(1, analytics.priorityTotals.low + analytics.priorityTotals.normal + analytics.priorityTotals.high)

  return (
    <Layout>
      <RewardBurst trigger={rewardTrigger} />
      <div className="max-w-7xl mx-auto space-y-6">
        <ConfirmDialog {...confirmDialog} />
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="heading-xl">Tasks</h1>
          <div className="flex items-center gap-2">
            <Link href="/analytics" className="btn-outline btn-sm">View Analytics</Link>
            <Button variant="outline" disabled={tasks.length === 0} onClick={() => exportTasksToCSV(tasks)}>
              Export CSV
            </Button>
          </div>
        </header>

        <Card title="ADHD-Friendly Start Lane" subtitle={`Energy profile: ${energy.label}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>Next smallest step</p>
              <p className="text-sm" style={{ color: 'var(--theme-text)' }}>{attention.nextSmallestStep || 'Add a task to get a tiny-start prompt.'}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>Intervention</p>
              <p className="text-sm" style={{ color: 'var(--theme-text)' }}>{attention.procrastinationWarning || attention.easyWin || 'Momentum looks steady. Keep using one-tap starts.'}</p>
              {attention.cbtTip && <p className="text-xs mt-2" style={{ color: 'var(--theme-text-dim)' }}>{attention.cbtTip}</p>}
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>Badges</p>
              <div className="flex flex-wrap gap-2">
                {badges.length === 0 ? (
                  <span className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>Finish one task or build a habit streak to unlock badges.</span>
                ) : badges.map((badge) => (
                  <span
                    key={badge.label}
                    className={`badge ${badge.tone === 'success' ? 'badge-success' : badge.tone === 'warning' ? 'badge-warning' : 'badge-accent'}`}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Quick Add">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleAdd()}
                placeholder="Task title"
                className="input-base flex-1"
              />
              <select value={goalId} onChange={(event) => setGoalId(event.target.value)} className="input-base sm:w-56">
                <option value="">No Goal</option>
                {goals.filter((goal) => goal.status === 'active').map((goal) => (
                  <option key={goal.id} value={goal.id}>{goal.title}</option>
                ))}
              </select>
              <button onClick={handleAdd} className="btn-accent px-4 py-2 rounded-lg text-sm">
                Add
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Voice commands work well for entries like add task buy milk tomorrow.
              </p>
              <VoiceInputButton onTranscript={handleVoiceTask} compact />
            </div>
          </div>
        </Card>

        <Card title="Filters">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="input-base">
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} className="input-base">
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
            <select value={project} onChange={(event) => setProject(event.target.value)} className="input-base">
              <option value="all">All Projects</option>
              {[...new Set(tasks.map((task) => task.project).filter(Boolean))].map((item) => (
                <option key={item as string} value={item as string}>{item as string}</option>
              ))}
            </select>
            <button
              onClick={() => { setStatus('all'); setPriority('all'); setProject('all') }}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-dim)' }}
            >
              Reset
            </button>
          </div>
        </Card>

        <Card title="Weekly Summary">
          <div className="flex flex-wrap gap-4 text-sm">
            {[
              { label: 'Created', value: weeklySummary.created },
              { label: 'In Progress', value: weeklySummary.inProgress },
              { label: 'Completed', value: weeklySummary.completed },
            ].map((item) => (
              <div key={item.label} className="panel-glass px-4 py-3 rounded-xl" style={{ border: '1px solid var(--theme-border)' }}>
                <div style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
                <div className="font-mono text-lg" style={{ color: 'var(--theme-text)' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Productivity Pulse">
          {tasks.length === 0 ? (
            <div className="text-sm subtle-muted">Add tasks to unlock analytics.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase mb-1" style={{ color: 'var(--theme-text-muted)' }}>Completion Rate</p>
                  <div className="text-4xl font-display" style={{ color: 'var(--theme-text)' }}>{analytics.completionRate}%</div>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{analytics.activeCount} active | {analytics.overdueCount} overdue</p>
                </div>
                <div>
                  <p className="text-xs uppercase mb-1" style={{ color: 'var(--theme-text-muted)' }}>Priority mix</p>
                  <div className="space-y-2 text-xs">
                    {(['high', 'normal', 'low'] as const).map((item) => (
                      <div key={item} className="space-y-1">
                        <div className="flex justify-between" style={{ color: 'var(--theme-text-muted)' }}>
                          <span className="capitalize">{item}</span>
                          <span>{analytics.priorityTotals[item]}</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: 'var(--theme-surface)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((analytics.priorityTotals[item] / priorityTotal) * 100)}%`,
                              background: item === 'high' ? '#f87171' : item === 'normal' ? 'var(--theme-accent)' : '#14b8a6',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase mb-2" style={{ color: 'var(--theme-text-muted)' }}>Weekly creation trend</p>
                  <ChartComponent data={analytics.weeklyVelocity} labels={analytics.weeklyLabels} color="var(--theme-accent)" height={160} />
                </div>
                <div>
                  <p className="text-xs uppercase mb-2" style={{ color: 'var(--theme-text-muted)' }}>Focus projects</p>
                  {analytics.focusProjects.length === 0 ? (
                    <div className="text-sm subtle-muted">No projects tagged yet.</div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      {analytics.focusProjects.map((projectItem) => (
                        <div key={projectItem.name} className="flex items-center justify-between px-3 py-2 rounded" style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}>
                          <span>{projectItem.name}</span>
                          <span className="font-mono" style={{ color: 'var(--theme-text-muted)' }}>{projectItem.count} tasks</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        <AICopilotInsightsCard title="Task Intelligence" sections={['summary', 'tasks', 'risk']} />

        {loading ? (
          <Card><CardSkeleton className="h-24" /></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {infinite.visibleItems.map((task) => {
              const steps = generateMicroSteps(task.title, energy)
              const taskState = getTaskMicroState(task.id)
              const completedCount = steps.filter((step) => taskState.done.includes(step.id)).length
              const nextGoal = task.goal_id ? goals.find((goal) => goal.id === task.goal_id) : null

              return (
                <Card key={task.id} title={task.title} subtitle={`Tiny starts: ${completedCount}/${steps.length}`}>
                  <div className="space-y-4">
                    <div className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{task.description ?? ''}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="badge" style={priorityStyle(task.priority)}>{task.priority}</span>
                      <span className="badge">{task.status}</span>
                      {task.project && <span className="badge">{task.project}</span>}
                      {task.due_date && <span className="badge">due {task.due_date}</span>}
                      {nextGoal && <span className="badge badge-accent">{nextGoal.title}</span>}
                    </div>

                    <div className="rounded-xl p-3" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                      <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>Next smallest step</p>
                      <p className="text-sm" style={{ color: 'var(--theme-text)' }}>
                        {steps[completedCount]?.title || 'All tiny starts finished. Mark the task done or keep momentum on the next task.'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {steps.map((step) => {
                        const isDone = taskState.done.includes(step.id)
                        const isActive = taskState.active === step.id && !isDone
                        return (
                          <div
                            key={step.id}
                            className="rounded-xl p-3"
                            style={{
                              background: isDone ? 'rgba(34, 197, 94, 0.12)' : isActive ? 'rgba(56, 189, 248, 0.12)' : 'var(--theme-surface)',
                              border: `1px solid ${isDone ? 'rgba(34, 197, 94, 0.25)' : isActive ? 'rgba(56, 189, 248, 0.25)' : 'var(--theme-border)'}`,
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm" style={{ color: 'var(--theme-text)' }}>{step.title}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>{step.minutes}-minute step</p>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                {!isDone && (
                                  <Button size="sm" variant={isActive ? 'secondary' : 'outline'} onClick={() => startMicroStep(task.id, step.id)}>
                                    {isActive ? 'In motion' : 'Start'}
                                  </Button>
                                )}
                                <Button size="sm" variant={isDone ? 'secondary' : 'primary'} onClick={() => completeMicroStep(task.id, task.title, step.id, steps.length)}>
                                  {isDone ? 'Done' : 'Done step'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => startMicroStep(task.id, steps[completedCount]?.id || steps[0].id)} className="btn-glow px-3 py-1 rounded text-xs">Tiny Start</button>
                      <button onClick={() => updateTask(task.id, { status: 'in_progress' })} className="btn-glow px-3 py-1 rounded text-xs">Start task</button>
                      <button onClick={async () => { await updateTask(task.id, { status: 'done' }); celebrate(task.title) }} className="btn-glow px-3 py-1 rounded text-xs">Done</button>
                      <button onClick={() => handleDelete(task.id, task.title)} className="px-3 py-1 rounded text-xs" style={{ border: '1px solid var(--theme-border)' }}>Delete</button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {!loading && infinite.canLoadMore && (
          <>
            <div ref={infinite.loaderRef} className="h-10" />
            <div className="flex justify-center">
              <Button variant="outline" onClick={infinite.loadMore}>Load more tasks</Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
