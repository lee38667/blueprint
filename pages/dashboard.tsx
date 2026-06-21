import React, { useMemo, useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import MetricCard from '../components/MetricCard'
import EmptyState from '../components/EmptyState'
import DailyFocusCard from '../components/DailyFocusCard'
import AICopilotCard from '../components/AICopilotCard'
import ChartComponent from '../components/Chart'
import ScriptureCard from '../components/ScriptureCard'
import MotivationQuoteCard from '../components/MotivationQuoteCard'
import AICopilotInsightsCard from '../components/AICopilotInsightsCard'
import DailyBriefingCard from '../components/DailyBriefingCard'
import FocusSessionCard from '../components/FocusSessionCard'
import AIRecorderCard from '../components/AIRecorderCard'
import GamificationDashboardCard from '../components/GamificationDashboardCard'
import BodyMapSelector from '../components/BodyMapSelector'
import { useDashboard } from '../hooks/useDashboard'
import { Icons } from '../components/icons'
import { useTasks } from '../hooks/useTasks'
import { useBodyStats } from '../hooks/useBodyStats'
import useBodyStatsCoach from '../hooks/useBodyStatsCoach'
import { CardSkeleton, LineSkeleton } from '../components/Skeleton'
import { useNotifications } from '../hooks/useNotifications'
import { useAIBrain } from '../hooks/useAIBrain'
import { useHabits } from '../hooks/useHabits'
import { useMotivationBoard } from '../hooks/useMotivationBoard'
import { useStore } from '../lib/store'
import { getAttentionIntervention, getRewardMessage } from '../lib/focusEngine'
import { summarizeBodyProgress } from '../lib/gamification'
import useGamification from '../hooks/useGamification'

const ZONES: Array<{ key: 'briefing' | 'metrics' | 'body' | 'gym' | 'motivation' | 'ai'; label: string }> = [
  { key: 'briefing', label: 'Briefing' },
  { key: 'metrics', label: 'Metrics' },
  { key: 'body', label: 'Body' },
  { key: 'gym', label: 'Gym' },
  { key: 'motivation', label: 'Motivation' },
  { key: 'ai', label: 'AI' },
]

export default function DashboardPage() {
  const { data, loading } = useDashboard()
  const { tasks, updateTask } = useTasks()
  const { evaluateAndInsert } = useNotifications()
  const { ready: brainReady, snapshot } = useAIBrain()
  const { habits, habitLogs } = useHabits()
  const { items: motivationItems } = useMotivationBoard()
  const { bodyWorkouts, logBodyWorkout, actionLoading: hunterLoading, profile: hunterProfile } = useGamification()
  const focusZones = useStore((state) => state.focusZones)
  const setFocusZone = useStore((state) => state.setFocusZone)
  const notifEvalRef = useRef(false)
  const quickTasks = tasks.filter((task) => task.status !== 'done').slice(0, 5)
  const { stats, addStat } = useBodyStats()
  const { data: coachTips, loading: coachLoading, error: coachError } = useBodyStatsCoach(stats)
  const [weight, setWeight] = useState('')
  const [sleep, setSleep] = useState('')
  const [water, setWater] = useState('')
  const [stress, setStress] = useState('')

  useEffect(() => {
    if (notifEvalRef.current || !brainReady) return
    const hasData = snapshot.tasks.length || snapshot.goals.length || snapshot.moods.length
    if (!hasData) return
    notifEvalRef.current = true
    evaluateAndInsert(snapshot, { habits, logs: habitLogs })
  }, [brainReady, snapshot, evaluateAndInsert, habits, habitLogs])

  const recentStats = [...stats].slice(-5).reverse()
  const weekWindow = useMemo(() => [...stats].slice(-7), [stats])
  const formatLabel = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const weightPoints = weekWindow.filter((entry) => typeof entry.weight === 'number')
  const weightSeries = weightPoints.length ? weightPoints.map((entry) => entry.weight as number) : [0]
  const weightLabels = weightPoints.length ? weightPoints.map((entry) => formatLabel(entry.recorded_at)) : ['No data']
  const sleepPoints = weekWindow.filter((entry) => typeof entry.sleep_hours === 'number')
  const sleepSeries = sleepPoints.length ? sleepPoints.map((entry) => entry.sleep_hours as number) : [0]
  const sleepLabels = sleepPoints.length ? sleepPoints.map((entry) => formatLabel(entry.recorded_at)) : ['No data']

  const balanceTrend = useMemo(() => {
    if (!data?.balanceHistory || data.balanceHistory.length < 2) return null
    const current = data.balanceHistory[data.balanceHistory.length - 1]
    const previous = data.balanceHistory[data.balanceHistory.length - 2]
    if (previous === 0) return null
    const change = ((current - previous) / Math.abs(previous)) * 100
    return { value: change.toFixed(1), positive: change >= 0 }
  }, [data?.balanceHistory])

  const weightChange = useMemo(() => {
    if (!data?.weightHistory || data.weightHistory.length < 2) return null
    const current = data.weightHistory[data.weightHistory.length - 1]
    const first = data.weightHistory[0]
    const diff = current - first
    return { value: Math.abs(diff).toFixed(1), positive: diff <= 0 }
  }, [data?.weightHistory])

  const attention = useMemo(() => getAttentionIntervention(snapshot), [snapshot])
  const rewardMessage = useMemo(() => getRewardMessage(motivationItems), [motivationItems])
  const bodyWorkoutProgress = useMemo(() => summarizeBodyProgress(bodyWorkouts), [bodyWorkouts])

  const glance = useMemo(() => {
    const todayKey = new Date().toLocaleDateString('en-CA')
    const open = tasks.filter((t) => t.status !== 'done').length
    const overdue = tasks.filter((t) => t.status !== 'done' && t.due_date && t.due_date.slice(0, 10) < todayKey).length
    const doneToday = tasks.filter((t) => t.status === 'done' && (t.updated_at ?? '').slice(0, 10) === todayKey).length
    const dailyHabits = habits.filter((h) => h.frequency === 'daily')
    const completedHabitIds = new Set(habitLogs.filter((l) => l.completed && l.logged_at.slice(0, 10) === todayKey).map((l) => l.habit_id))
    const habitsDone = dailyHabits.filter((h) => completedHabitIds.has(h.id)).length
    return { open, overdue, doneToday, habitsDone, dailyHabitTotal: dailyHabits.length }
  }, [tasks, habits, habitLogs])

  const handleBodySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!weight && !sleep && !water && !stress) return
    await addStat({
      weight: weight ? parseFloat(weight) : null,
      sleep_hours: sleep ? parseFloat(sleep) : null,
      water_ml: water ? parseInt(water, 10) : null,
      stress: stress ? parseInt(stress, 10) : null,
    })
    setWeight('')
    setSleep('')
    setWater('')
    setStress('')
  }

  return (
    <Layout>
      <PageContainer className="md:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4 md:mb-8">
          <div>
            <h1 className="heading-xl mb-1">Dashboard</h1>
            <p className="subtle-muted text-sm">Adaptive command center with focus zones, recovery cues, and tiny-start support.</p>
          </div>
          <div className="text-sm font-mono" style={{ color: 'var(--theme-text-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <MetricCard label="Done today" value={glance.doneToday} tone="success" icon={<Icons.Check size="sm" />} />
          <MetricCard label="Open tasks" value={glance.open} />
          <MetricCard
            label="Overdue"
            value={glance.overdue}
            tone={glance.overdue === 0 ? 'success' : 'danger'}
            icon={glance.overdue > 0 ? <Icons.AlertTriangle size="sm" /> : undefined}
          />
          <MetricCard
            label="Habits today"
            value={glance.dailyHabitTotal ? `${glance.habitsDone}/${glance.dailyHabitTotal}` : '—'}
            tone={glance.dailyHabitTotal > 0 && glance.habitsDone === glance.dailyHabitTotal ? 'success' : 'default'}
          />
        </div>

        <Card title="Focus Zones">
          <div className="flex flex-wrap gap-2">
            {ZONES.map((zone) => (
              <button
                key={zone.key}
                onClick={() => setFocusZone(zone.key, !focusZones[zone.key])}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: focusZones[zone.key] ? 'var(--theme-accent)' : 'var(--theme-surface)',
                  color: focusZones[zone.key] ? 'var(--theme-accent-text)' : 'var(--theme-text-dim)',
                  border: `1px solid ${focusZones[zone.key] ? 'transparent' : 'var(--theme-border)'}`,
                }}
              >
                {zone.label}
              </button>
            ))}
          </div>
        </Card>

        {focusZones.briefing && <DailyBriefingCard />}

        <GamificationDashboardCard />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {focusZones.metrics && (
            <Card title="Financial Snapshot">
              {loading ? (
                <CardSkeleton className="h-24" />
              ) : (
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Total Balance</span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight" style={{ color: 'var(--theme-accent)' }}>
                        $ {data?.balance?.toLocaleString() ?? '0'}
                      </span>
                      {balanceTrend && (
                        <div className="text-xs flex items-center gap-1" style={{ color: balanceTrend.positive ? 'var(--theme-accent)' : '#ef4444' }}>
                          <Icons.TrendingUp size="sm" />
                          <span>{balanceTrend.positive ? '+' : ''}{balanceTrend.value}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 h-20">
                    <ChartComponent data={data?.balanceHistory?.length ? data.balanceHistory : [0]} labels={data?.balanceLabels?.length ? data.balanceLabels : ['-']} color="var(--theme-accent)" height={80} />
                  </div>
                </div>
              )}
            </Card>
          )}

          {focusZones.metrics && (
            <Card title="Quick Tasks">
              <div className="space-y-2">
                {quickTasks.length === 0 ? (
                  <EmptyState variant="compact" title="No open tasks" description="Add some on the Tasks page." />
                ) : (
                  quickTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-xl" style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">{task.title}</div>
                        <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{task.project || 'General'} | {task.priority}</div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {task.status !== 'in_progress' && (
                          <button className="btn-glow px-2 py-1 rounded text-xs" onClick={() => updateTask(task.id, { status: 'in_progress' })}>Start</button>
                        )}
                        <button className="px-2 py-1 rounded text-xs" style={{ border: '1px solid var(--theme-border)' }} onClick={() => updateTask(task.id, { status: 'done' })}>Done</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {focusZones.ai && <AICopilotCard />}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <FocusSessionCard snapshot={{ moods: snapshot.moods, bodyStats: snapshot.bodyStats }} rewardMessage={rewardMessage} />
          <Card title="Attention Signals">
            <div className="space-y-3 text-sm">
              <div className="rounded-xl p-3" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>Easy win</p>
                <p style={{ color: 'var(--theme-text)' }}>{attention.easyWin || 'Nothing urgent enough to trigger an easy-win redirect.'}</p>
              </div>
              {attention.procrastinationWarning && (
                <div className="rounded-xl p-3 border border-amber-500/30 bg-amber-500/10 text-amber-100">{attention.procrastinationWarning}</div>
              )}
              {attention.hyperfocusWarning && (
                <div className="rounded-xl p-3 border border-red-500/30 bg-red-500/10 text-red-100">{attention.hyperfocusWarning}</div>
              )}
              {attention.cbtTip && <p style={{ color: 'var(--theme-text-dim)' }}>{attention.cbtTip}</p>}
            </div>
          </Card>
          <AIRecorderCard />
        </section>

        {focusZones.motivation && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <DailyFocusCard />
            <MotivationQuoteCard />
            <ScriptureCard />
            <AICopilotInsightsCard />
          </div>
        )}

        {focusZones.body && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <Card title="Body Stats Quick Log">
              <form onSubmit={handleBodySubmit} className="grid grid-cols-2 gap-3">
                <input type="number" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Weight" className="input-base" />
                <input type="number" step="0.5" value={sleep} onChange={(event) => setSleep(event.target.value)} placeholder="Sleep hrs" className="input-base" />
                <input type="number" value={water} onChange={(event) => setWater(event.target.value)} placeholder="Water ml" className="input-base" />
                <input type="number" min="0" max="10" value={stress} onChange={(event) => setStress(event.target.value)} placeholder="Stress (0-10)" className="input-base" />
                <button className="btn-accent col-span-2 text-xs rounded-lg py-2" type="submit">Log Stats</button>
              </form>
            </Card>
            <Card title="Weekly Trends">
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase mb-2" style={{ color: 'var(--theme-text-muted)' }}>Weight</p>
                  <ChartComponent data={weightSeries} labels={weightLabels} color="#FF9D00" height={120} />
                </div>
                <div>
                  <p className="text-xs uppercase mb-2" style={{ color: 'var(--theme-text-muted)' }}>Sleep Hours</p>
                  <ChartComponent data={sleepSeries} labels={sleepLabels} color="#7C5CFF" height={120} />
                </div>
              </div>
            </Card>
            <Card title="Body Coach">
              {coachLoading ? (
                <LineSkeleton className="w-full" />
              ) : coachError ? (
                <p className="text-sm text-red-300">{coachError}</p>
              ) : coachTips ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{coachTips.headline}</p>
                  <ul className="text-sm space-y-2" style={{ color: 'var(--theme-text-dim)' }}>
                    {coachTips.insights.map((tip: string, index: number) => (
                      <li key={index} className="flex gap-2"><span style={{ color: 'var(--theme-accent)' }}>•</span><span>{tip}</span></li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Log a few days of stats to unlock personalized guidance.</p>
              )}
            </Card>
          </section>
        )}

        {focusZones.body && (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            <Card title="Recent Body Metrics">
              <div className="space-y-2">
                {recentStats.length === 0 ? (
                  <EmptyState variant="compact" title="No entries yet" description="Log weight, sleep, water, or stress to start a trend." />
                ) : (
                  recentStats.map((stat) => (
                    <div key={stat.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded text-sm" style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}>
                      <div>
                        <div className="font-medium">{new Date(stat.recorded_at).toLocaleDateString()}</div>
                        <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                          Weight {stat.weight ?? '-'} | Sleep {stat.sleep_hours ?? '-'} | Water {stat.water_ml ?? '-'} ml | Stress {stat.stress ?? '-'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <BodyMapSelector
              onLog={logBodyWorkout}
              progress={bodyWorkoutProgress}
              unlockedAreas={hunterProfile?.unlocked_areas ?? ['head', 'arms']}
              loading={hunterLoading}
            />
          </section>
        )}

        {focusZones.gym && (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xl font-display font-bold" style={{ color: 'var(--theme-text)' }}>Gym Summary</h2>
              <div className="h-px flex-1" style={{ background: 'var(--theme-border)' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Card title="Schedule" className="min-h-[200px]">
                <div className="h-full flex items-center justify-center subtle-muted"><span>No schedule connected.</span></div>
              </Card>
              <Card title="Body Stats" className="min-h-[200px]">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Current Weight</span>
                      <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight" style={{ color: 'var(--theme-text)' }}>
                        {data?.weightHistory?.length ? data.weightHistory[data.weightHistory.length - 1].toFixed(1) : '-'} <span className="text-lg" style={{ color: 'var(--theme-text-muted)' }}>lbs</span>
                      </div>
                    </div>
                    {weightChange && <div className="text-xs flex items-center gap-1 mb-1" style={{ color: weightChange.positive ? 'var(--theme-accent)' : '#ef4444' }}><span>{weightChange.positive ? '-' : '+'}{weightChange.value} lbs</span></div>}
                  </div>
                  <div className="flex-1 min-h-[100px]">
                    <ChartComponent data={data?.weightHistory?.length ? data.weightHistory : [0]} labels={data?.weightLabels?.length ? data.weightLabels : ['-']} color="#B300FF" height={100} />
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}
      </PageContainer>
    </Layout>
  )
}
