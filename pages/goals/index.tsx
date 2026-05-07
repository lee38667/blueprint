import { useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import AICopilotInsightsCard from '../../components/AICopilotInsightsCard'
import ProgressBar, { calculateGoalProgress, calculateMilestoneProgress } from '../../components/ProgressBar'
import ProgressRing from '../../components/ProgressRing'
import VoiceInputButton from '../../components/VoiceInputButton'
import { CardSkeleton } from '../../components/Skeleton'
import { useGoals } from '../../hooks/useGoals'
import useGoalCoach from '../../hooks/useGoalCoach'
import useMoodLogs from '../../hooks/useMoodLogs'
import useBodyStats from '../../hooks/useBodyStats'
import { getEnergyProfile, getNextSmallestStep } from '../../lib/focusEngine'
import { exportGoalsToCSV } from '../../lib/csvExport'

export default function GoalsPage() {
  const { goals, milestones, subtasks, loading, addGoal, updateStatus, addMilestone, updateMilestone, addSubtask, updateSubtask, getLinkedTaskProgress } = useGoals()
  const { logs: moodLogs } = useMoodLogs()
  const { stats } = useBodyStats()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [msTitle, setMsTitle] = useState('')
  const [msDue, setMsDue] = useState('')
  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [stTitle, setStTitle] = useState('')
  const [selectedMilestone, setSelectedMilestone] = useState<string>('')
  const [coachGoal, setCoachGoal] = useState<string>('')
  const { data: goalInsight, loading: coachLoading, error: coachError, evaluate } = useGoalCoach()

  const energy = useMemo(() => getEnergyProfile({ moods: moodLogs, bodyStats: stats }), [moodLogs, stats])
  const featuredGoal = goals.find((goal) => goal.status === 'active') ?? goals[0] ?? null
  const featuredNextStep = featuredGoal ? getNextSmallestStep(featuredGoal.title, energy) : 'Create a goal to get a next-smallest-step prompt.'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title) return
    await addGoal({ title, category: category || null, target_date: targetDate || null })
    setTitle('')
    setCategory('')
    setTargetDate('')
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 py-4">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-display font-bold">Long-term Goals</h1>
          <Button variant="outline" disabled={goals.length === 0} onClick={() => exportGoalsToCSV(goals)}>
            Export CSV
          </Button>
        </header>

        <Card title="Goal Momentum" subtitle={`Energy-aware planning: ${energy.label}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>Next smallest step</p>
              <p className="text-sm" style={{ color: 'var(--theme-text)' }}>{featuredNextStep}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>Why this helps</p>
              <p className="text-sm" style={{ color: 'var(--theme-text)' }}>
                Rings visualize progress at a glance, while tiny-step prompts reduce initiation cost when energy is low.
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>Coach mode</p>
              <p className="text-sm" style={{ color: 'var(--theme-text)' }}>
                Use the AI coach below when a goal feels stuck or too big to enter on your own.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Add Goal">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Goal</label>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="input-base w-full" />
              <div className="mt-2"><VoiceInputButton onTranscript={(text) => setTitle((current) => `${current} ${text}`.trim())} compact /></div>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Category</label>
              <input value={category} onChange={(event) => setCategory(event.target.value)} className="input-base w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Target Date</label>
              <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="input-base w-full" />
            </div>
            <Button variant="primary" className="text-xs w-full md:w-auto" type="submit">Save Goal</Button>
          </form>
        </Card>

        <Card title="Add Milestone">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>For Goal</label>
              <select value={selectedGoal} onChange={(event) => setSelectedGoal(event.target.value)} className="input-base w-full">
                <option value="">Select goal</option>
                {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Milestone</label>
              <input value={msTitle} onChange={(event) => setMsTitle(event.target.value)} className="input-base w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Due Date</label>
              <input type="date" value={msDue} onChange={(event) => setMsDue(event.target.value)} className="input-base w-full" />
            </div>
            <Button variant="primary" className="text-xs w-full md:w-auto" onClick={async () => {
              if (!selectedGoal || !msTitle) return
              await addMilestone(selectedGoal, { title: msTitle, due_date: msDue || null })
              setMsTitle('')
              setMsDue('')
            }}>
              Add Milestone
            </Button>
          </div>
        </Card>

        <Card title="Add Subtask">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>For Milestone</label>
              <select value={selectedMilestone} onChange={(event) => setSelectedMilestone(event.target.value)} className="input-base w-full">
                <option value="">Select milestone</option>
                {milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.title}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Subtask</label>
              <input value={stTitle} onChange={(event) => setStTitle(event.target.value)} className="input-base w-full" />
            </div>
            <Button variant="primary" className="text-xs w-full md:w-auto" onClick={async () => {
              if (!selectedMilestone || !stTitle) return
              await addSubtask(selectedMilestone, { title: stTitle })
              setStTitle('')
            }}>
              Add Subtask
            </Button>
          </div>
        </Card>

        <AICopilotInsightsCard title="Goal Intelligence" sections={['summary', 'goals', 'wellness', 'risk']} />
        <Card title="AI Goal Coach">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Select goal</label>
              <select value={coachGoal} onChange={(event) => setCoachGoal(event.target.value)} className="input-base w-full">
                <option value="">Choose goal</option>
                {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
              </select>
            </div>
            <Button
              variant="primary"
              className={`text-xs w-full md:w-auto ${(!coachGoal || coachLoading) ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={async () => {
                if (!coachGoal || coachLoading) return
                const goal = goals.find((item) => item.id === coachGoal) ?? null
                const goalMilestones = milestones.filter((milestone) => milestone.goal_id === coachGoal)
                const goalSubtasks = subtasks.filter((subtask) => goalMilestones.some((milestone) => milestone.id === subtask.milestone_id))
                await evaluate(goal, goalMilestones, goalSubtasks)
              }}
            >
              {coachLoading ? 'Analyzing...' : 'Evaluate Progress'}
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {!coachGoal ? (
              <p className="text-sm subtle-muted">Pick a goal to receive tailored feedback.</p>
            ) : coachLoading ? (
              <CardSkeleton className="h-16" />
            ) : goalInsight ? (
              <div className="space-y-3 text-sm text-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-display text-white">{goalInsight.momentumScore}</div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">Momentum score</div>
                </div>
                <p>{goalInsight.summary}</p>
                {goalInsight.risks.length > 0 && (
                  <div>
                    <p className="text-xs uppercase text-red-300 mb-1">Risks</p>
                    <ul className="list-disc pl-5 space-y-1 text-red-200">
                      {goalInsight.risks.map((risk, index) => <li key={index}>{risk}</li>)}
                    </ul>
                  </div>
                )}
                {goalInsight.nextSteps.length > 0 && (
                  <div>
                    <p className="text-xs uppercase mb-1" style={{ color: 'var(--theme-accent)' }}>Next steps</p>
                    <ul className="list-disc pl-5 space-y-1 text-neutral-100">
                      {goalInsight.nextSteps.map((step, index) => <li key={index}>{step}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm subtle-muted">No insight yet. Run an evaluation when ready.</p>
            )}
            {coachError && <div className="text-xs text-red-400">{coachError}</div>}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <Card><CardSkeleton className="h-24" /></Card>
          ) : goals.map((goal) => {
            const goalMilestones = milestones.filter((milestone) => milestone.goal_id === goal.id)
            const progress = calculateGoalProgress(goalMilestones)
            const goalPercent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
            const linked = getLinkedTaskProgress(goal.id)

            return (
              <Card key={goal.id}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white">{goal.title}</div>
                      {goal.category && <div className="text-[11px]" style={{ color: 'var(--theme-accent)' }}>{goal.category}</div>}
                      {goal.target_date && <div className="text-[11px] text-gray-500 mt-1">Target: {goal.target_date}</div>}
                    </div>
                    <ProgressRing value={goalPercent} size={84} label="Goal" subtitle={`${progress.current}/${progress.total || 0}`} />
                  </div>

                  <div className="rounded-xl p-3" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                    <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>Next smallest step</p>
                    <p className="text-sm" style={{ color: 'var(--theme-text)' }}>{getNextSmallestStep(goal.title, energy)}</p>
                  </div>

                  {progress.total > 0 && (
                    <ProgressBar current={progress.current} total={progress.total} size="sm" showPercentage />
                  )}

                  <div>
                    <div className="text-[11px] mb-2" style={{ color: 'var(--theme-text-muted)' }}>Milestones</div>
                    <div className="space-y-2">
                      {goalMilestones.map((milestone) => {
                        const milestoneSubtasks = subtasks.filter((subtask) => subtask.milestone_id === milestone.id)
                        const milestoneProgress = calculateMilestoneProgress(milestoneSubtasks)
                        const milestonePercent = milestoneProgress.total > 0 ? Math.round((milestoneProgress.current / milestoneProgress.total) * 100) : 0
                        return (
                          <div key={milestone.id} className="p-3 rounded-xl" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="text-sm">{milestone.title}</div>
                                <div className="text-[11px] text-gray-500">{milestone.due_date || 'No due date'}</div>
                              </div>
                              <ProgressRing value={milestonePercent} size={64} strokeWidth={8} label="Milestone" />
                            </div>
                            {milestoneProgress.total > 0 && (
                              <div className="mt-2"><ProgressBar current={milestoneProgress.current} total={milestoneProgress.total} size="sm" showPercentage={false} /></div>
                            )}
                            <div className="flex gap-2 text-[11px] mt-3">
                              <button onClick={() => updateMilestone(milestone.id, { status: 'pending' })} className="px-2 py-0.5 rounded" style={{ background: 'var(--theme-card-bg)' }}>Pending</button>
                              <button onClick={() => updateMilestone(milestone.id, { status: 'in_progress' })} className="px-2 py-0.5 rounded" style={{ background: 'var(--theme-card-bg)' }}>Start</button>
                              <button onClick={() => updateMilestone(milestone.id, { status: 'done' })} className="px-2 py-0.5 rounded" style={{ background: 'var(--theme-card-bg)' }}>Done</button>
                            </div>
                            <div className="mt-2 pl-2" style={{ borderLeft: '1px solid var(--theme-border)' }}>
                              {milestoneSubtasks.map((subtask) => (
                                <div key={subtask.id} className="flex items-center justify-between py-1 gap-3">
                                  <span className="text-[12px]">• {subtask.title}</span>
                                  <div className="flex gap-2 text-[11px]">
                                    <button onClick={() => updateSubtask(subtask.id, { status: 'todo' })} className="px-2 py-0.5 rounded" style={{ background: 'var(--theme-card-bg)' }}>To Do</button>
                                    <button onClick={() => updateSubtask(subtask.id, { status: 'in_progress' })} className="px-2 py-0.5 rounded" style={{ background: 'var(--theme-card-bg)' }}>Start</button>
                                    <button onClick={() => updateSubtask(subtask.id, { status: 'done' })} className="px-2 py-0.5 rounded" style={{ background: 'var(--theme-card-bg)' }}>Done</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {linked.total > 0 && (
                    <div>
                      <div className="text-[11px] mb-1" style={{ color: 'var(--theme-text-muted)' }}>
                        Linked Tasks ({linked.completed}/{linked.total} done)
                      </div>
                      <div className="space-y-1">
                        {linked.tasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-2 text-[12px] py-1 px-2 rounded" style={{ background: 'var(--theme-surface)' }}>
                            <span style={{ color: task.status === 'done' ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }}>
                              {task.status === 'done' ? 'Done' : 'Open'}
                            </span>
                            <span style={{ color: 'var(--theme-text-dim)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-2 text-[11px]">
                    <button onClick={() => updateStatus(goal.id, 'active')} className="px-2 py-0.5 rounded" style={{ background: 'var(--theme-surface)' }}>Active</button>
                    <button onClick={() => updateStatus(goal.id, 'paused')} className="px-2 py-0.5 rounded" style={{ background: 'var(--theme-surface)' }}>Pause</button>
                    <button onClick={() => updateStatus(goal.id, 'completed')} className="px-2 py-0.5 rounded" style={{ background: 'var(--theme-surface)' }}>Done</button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}


