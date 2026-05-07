import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Card from './Card'
import RewardBurst from './RewardBurst'
import LevelUpModal from './LevelUpModal'
import GamificationRadar from './GamificationRadar'
import { useAIBrain } from '../hooks/useAIBrain'
import { useGamification } from '../hooks/useGamification'
import { useGoals } from '../hooks/useGoals'
import { useHabits } from '../hooks/useHabits'
import useMoodLogs from '../hooks/useMoodLogs'
import { useTasks } from '../hooks/useTasks'
import type { Quest } from '../types/models'
import type { HunterRadarStat } from '../lib/aiSnapshot'

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function getExpProgress(level: number, exp: number) {
  const threshold = 100 + Math.max(0, level - 1) * 40
  return { threshold, percent: clampPercent((exp / threshold) * 100) }
}

function isQuestDone(quest: Quest) {
  return quest.status === 'completed'
}

export default function GamificationDashboardCard() {
  const { tasks } = useTasks()
  const { habits, getStreak, getCompletionMap } = useHabits()
  const { goals } = useGoals()
  const { logs: moodLogs } = useMoodLogs()
  const { ready, insights, loading: brainLoading, refresh } = useAIBrain({ auto: true })
  const {
    profile,
    quests,
    bodyWorkouts,
    actionLoading,
    activeQuestId,
    levelUp,
    generateDailyQuests,
    completeQuest,
    claimSkill,
    acceptQuest,
    dismissLevelUp,
  } = useGamification()
  const [rewardTrigger, setRewardTrigger] = useState(0)
  const autoRequested = useRef(false)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!ready || autoRequested.current || quests.length >= 3) return
    autoRequested.current = true
    void generateDailyQuests({
      tasks: tasks.slice(0, 10).map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        status: task.status,
        project: task.project,
        due_date: task.due_date,
      })),
      habits: habits.slice(0, 8).map((habit) => ({
        id: habit.id,
        name: habit.name,
        frequency: habit.frequency,
        currentStreak: getStreak(habit.id),
        completedToday: !!getCompletionMap(habit.id)[today],
      })),
      goals: goals.slice(0, 5).map((goal) => ({
        id: goal.id,
        title: goal.title,
        status: goal.status,
        target_date: goal.target_date,
      })),
    })
  }, [generateDailyQuests, getCompletionMap, getStreak, goals, habits, quests.length, ready, tasks, today])

  const questCompletion = useMemo(() => {
    const completed = quests.filter(isQuestDone).length
    return quests.length ? completed / quests.length : 0
  }, [quests])

  const fallbackStats = useMemo<HunterRadarStat[]>(() => {
    const valid = moodLogs.filter((log) => typeof log.mood_score === 'number')
    const strength = valid.length ? clampPercent((valid.reduce((sum, log) => sum + (log.mood_score ?? 0), 0) / valid.length) * 10) : 55
    const agility = tasks.length ? clampPercent((tasks.filter((task) => task.status === 'done').length / tasks.length) * 100) : 45
    const endurance = habits.length
      ? clampPercent(habits.reduce((sum, habit) => sum + Math.min(getStreak(habit.id) * 12, 100), 0) / habits.length)
      : 40
    const recovery = clampPercent(Math.min(bodyWorkouts.length * 14, 100))
    const focus = clampPercent(questCompletion * 100)

    return [
      { key: 'strength', label: 'Strength', value: strength, reason: 'Fallback from mood logs and emotional steadiness.' },
      { key: 'agility', label: 'Agility', value: agility, reason: 'Fallback from task completion ratio.' },
      { key: 'endurance', label: 'Endurance', value: endurance, reason: 'Fallback from habit streak consistency.' },
      { key: 'recovery', label: 'Recovery', value: recovery, reason: 'Fallback from body-workout activity.' },
      { key: 'focus', label: 'Focus', value: focus, reason: 'Fallback from daily quest completion.' },
    ]
  }, [bodyWorkouts.length, getStreak, habits, moodLogs, questCompletion, tasks])

  const hunterStats = insights?.hunterRadar?.stats?.length ? insights.hunterRadar.stats : fallbackStats
  const hunterSummary = insights?.hunterRadar?.summary || 'Hunter stats are being estimated from your latest recorded data.'
  const rebalanceActions = insights?.hunterRadar?.actions?.length
    ? insights.hunterRadar.actions
    : [
        'Recovery is lagging: log one short body session and protect a real sleep window tonight.',
        'Focus needs support: clear one small pending task before opening anything new.',
        'Endurance grows fast from tiny wins: rescue one habit streak today.',
      ]
  const statCards = hunterStats.slice(0, 3)
  const exp = profile ? getExpProgress(profile.level, profile.exp) : { threshold: 100, percent: 0 }

  const complete = async (quest: Quest) => {
    const result = await completeQuest({
      questId: quest.id,
      sourceType: quest.type,
      linkedId: quest.linked_entity_id,
      bodyPart: quest.body_part,
    })
    if (result) {
      setRewardTrigger(Date.now())
    }
  }

  return (
    <>
      <RewardBurst trigger={rewardTrigger} />
      <LevelUpModal
        open={!!levelUp}
        level={levelUp?.level ?? 0}
        narrative={levelUp?.narrative ?? ''}
        choices={levelUp?.choices ?? []}
        unlockedAreas={levelUp?.unlockedAreas ?? []}
        onClose={dismissLevelUp}
        onClaim={claimSkill}
      />

      <Card
        title="Hunter Dashboard"
        subtitle="Solo Leveling mode for daily momentum, tiny starts, and AI-grounded stat tracking."
        actions={
          <div className="flex gap-2">
            <button className="btn-outline text-xs" onClick={() => void refresh()} disabled={brainLoading}>
              {brainLoading ? 'Reading Data...' : 'Refresh Radar'}
            </button>
            <button
              className="btn-outline text-xs"
              onClick={() => void generateDailyQuests({
                force: true,
                tasks: tasks.slice(0, 10).map((task) => ({
                  id: task.id,
                  title: task.title,
                  priority: task.priority,
                  status: task.status,
                  project: task.project,
                  due_date: task.due_date,
                })),
                habits: habits.slice(0, 8).map((habit) => ({
                  id: habit.id,
                  name: habit.name,
                  frequency: habit.frequency,
                  currentStreak: getStreak(habit.id),
                  completedToday: !!getCompletionMap(habit.id)[today],
                })),
                goals: goals.slice(0, 5).map((goal) => ({
                  id: goal.id,
                  title: goal.title,
                  status: goal.status,
                  target_date: goal.target_date,
                })),
              })}
            >
              Refresh Quests
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[28px] border p-5" style={{ borderColor: 'rgba(56, 189, 248, 0.18)', background: 'radial-gradient(circle at top, rgba(56, 189, 248, 0.14), rgba(2, 6, 23, 0.94) 58%)' }}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-accent">{profile?.class ?? 'Awakened'}</span>
                  <span className="badge">Level {profile?.level ?? 1}</span>
                  <span className="badge">{profile?.gold ?? 0} gold</span>
                  <span className="badge">{brainLoading ? 'AI reading logs' : 'AI radar grounded'}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--theme-text)' }}>Daily Gate Clear</h3>
                  <p className="mt-1 text-sm" style={{ color: 'var(--theme-text-dim)' }}>
                    {hunterSummary}
                  </p>
                </div>
              </div>

              <div className="min-w-[240px] space-y-2 rounded-2xl border px-4 py-3" style={{ borderColor: 'rgba(56, 189, 248, 0.18)', background: 'rgba(15, 23, 42, 0.62)' }}>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em]" style={{ color: 'var(--theme-text-muted)' }}>
                  <span>EXP</span>
                  <span>{profile?.exp ?? 0} / {exp.threshold}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-black/30">
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${exp.percent}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    style={{ background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.95), rgba(250, 204, 21, 0.95))' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {statCards.map((stat) => (
                  <div key={stat.key} className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)' }}>
                    <div className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--theme-text-muted)' }}>{stat.label}</div>
                    <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--theme-text)' }}>{stat.value}</div>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{stat.reason}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border p-4" style={{ borderColor: 'rgba(250, 204, 21, 0.25)', background: 'rgba(250, 204, 21, 0.08)' }}>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--theme-text-muted)' }}>AI Rebalance Plan</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--theme-text-dim)' }}>
                      The AI is turning your weakest current stats into concrete next moves.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {rebalanceActions.map((action, index) => (
                      <div key={`${index}-${action}`} className="rounded-xl border px-3 py-3" style={{ borderColor: 'rgba(250, 204, 21, 0.2)', background: 'rgba(15, 23, 42, 0.42)' }}>
                        <div className="flex gap-3">
                          <span className="badge badge-accent">{index + 1}</span>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text)' }}>{action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {quests.length === 0 ? (
                  <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)' }}>
                    No daily quests yet. Summon the hunter board to generate a fresh run.
                  </div>
                ) : quests.map((quest) => (
                  <div
                    key={quest.id}
                    className="rounded-[24px] border p-4 transition-transform"
                    style={{
                      borderColor: activeQuestId === quest.id ? 'rgba(250, 204, 21, 0.55)' : 'var(--theme-border)',
                      background: activeQuestId === quest.id ? 'rgba(250, 204, 21, 0.09)' : 'var(--theme-surface)',
                    }}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="badge badge-accent">{quest.type}</span>
                          <span className="badge">+{quest.exp_reward} EXP</span>
                          <span className="badge">+{quest.gold_reward} gold</span>
                          {quest.body_part && <span className="badge">{quest.body_part}</span>}
                        </div>
                        <div>
                          <h4 className="text-base font-semibold" style={{ color: 'var(--theme-text)' }}>{quest.name}</h4>
                          <p className="mt-1 text-sm" style={{ color: 'var(--theme-text-dim)' }}>{quest.description}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {quest.status === 'completed' ? (
                          <span className="badge badge-success">Cleared</span>
                        ) : (
                          <>
                            <button type="button" onClick={() => acceptQuest(activeQuestId === quest.id ? null : quest.id)} className="btn-outline text-xs">
                              {activeQuestId === quest.id ? 'Tracking' : 'Accept'}
                            </button>
                            <button type="button" onClick={() => void complete(quest)} disabled={actionLoading} className="btn-accent text-xs">
                              Complete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border p-4" style={{ borderColor: 'rgba(56, 189, 248, 0.16)', background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.94))' }}>
              <div className="mb-3 space-y-2">
                <p className="text-xs uppercase tracking-[0.28em]" style={{ color: 'var(--theme-text-muted)' }}>AI Stat Radar</p>
                <p className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>
                  The AI is weighting these stats from your recorded tasks, moods, habits, body stats, and body-workout logs.
                </p>
              </div>
              <GamificationRadar
                labels={hunterStats.map((stat) => stat.label)}
                values={hunterStats.map((stat) => stat.value)}
              />
              <div className="mt-4 space-y-2">
                {hunterStats.map((stat) => (
                  <div key={stat.key} className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--theme-border)', background: 'rgba(15, 23, 42, 0.45)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{stat.label}</span>
                      <span className="badge badge-accent">{stat.value}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{stat.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}
