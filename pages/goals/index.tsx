import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import AICopilotInsightsCard from '../../components/AICopilotInsightsCard'
import { useGoals } from '../../hooks/useGoals'
import useGoalCoach from '../../hooks/useGoalCoach'
import { useState } from 'react'

export default function GoalsPage(){
  const { goals, milestones, subtasks, loading, addGoal, updateStatus, addMilestone, updateMilestone, addSubtask, updateSubtask } = useGoals()
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title) return
    await addGoal({ title, category: category || null, target_date: targetDate || null })
    setTitle('')
    setCategory('')
    setTargetDate('')
  }

  return (
    <div className="min-h-screen flex bg-black text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-8 space-y-6">
          <h1 className="text-2xl font-display font-bold">Long-term Goals</h1>

          <Card title="Add Goal">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Goal</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Category</label>
                <input
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
                />
              </div>
              <Button variant="primary" className="text-xs w-full md:w-auto">Save Goal</Button>
            </form>
          </Card>

          <Card title="Add Milestone">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-400 mb-1">For Goal</label>
                <select value={selectedGoal} onChange={e=>setSelectedGoal(e.target.value)} className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm">
                  <option value="">Select goal</option>
                  {goals.map(g=> <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Milestone</label>
                <input value={msTitle} onChange={e=>setMsTitle(e.target.value)} className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Due Date</label>
                <input type="date" value={msDue} onChange={e=>setMsDue(e.target.value)} className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
              </div>
              <Button variant="primary" className="text-xs w-full md:w-auto" onClick={async()=>{ if(!selectedGoal||!msTitle) return; await addMilestone(selectedGoal, { title: msTitle, due_date: msDue || null }); setMsTitle(''); setMsDue('') }}>Add Milestone</Button>
            </div>
          </Card>

          <Card title="Add Subtask">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-400 mb-1">For Milestone</label>
                <select value={selectedMilestone} onChange={e=>setSelectedMilestone(e.target.value)} className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm">
                  <option value="">Select milestone</option>
                  {milestones.map(m=> <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Subtask</label>
                <input value={stTitle} onChange={e=>setStTitle(e.target.value)} className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
              </div>
              <Button variant="primary" className="text-xs w-full md:w-auto" onClick={async()=>{ if(!selectedMilestone||!stTitle) return; await addSubtask(selectedMilestone, { title: stTitle }); setStTitle('') }}>Add Subtask</Button>
            </div>
          </Card>

          <AICopilotInsightsCard title="Goal Intelligence" sections={['summary', 'goals', 'wellness', 'risk']} />
          <Card title="AI Goal Coach">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Select goal</label>
                <select value={coachGoal} onChange={e=>setCoachGoal(e.target.value)} className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm">
                  <option value="">Choose goal</option>
                  {goals.map(goal => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
                </select>
              </div>
              <Button
                variant="primary"
                className={`text-xs w-full md:w-auto ${(!coachGoal || coachLoading) ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={async () => {
                  if (!coachGoal || coachLoading) return
                  const goal = goals.find(g => g.id === coachGoal) ?? null
                  const goalMilestones = milestones.filter(m => m.goal_id === coachGoal)
                  const goalSubtasks = subtasks.filter(s => goalMilestones.some(m => m.id === s.milestone_id))
                  await evaluate(goal, goalMilestones, goalSubtasks)
                }}
              >
                {coachLoading ? 'Analyzing…' : 'Evaluate Progress'}
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {!coachGoal ? (
                <p className="text-sm subtle-muted">Pick a goal to receive tailored feedback.</p>
              ) : coachLoading ? (
                <div className="card-skeleton h-16" />
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
                        {goalInsight.risks.map((risk, idx) => (
                          <li key={idx}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {goalInsight.nextSteps.length > 0 && (
                    <div>
                      <p className="text-xs uppercase text-electric mb-1">Next steps</p>
                      <ul className="list-disc pl-5 space-y-1 text-neutral-100">
                        {goalInsight.nextSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              <Card><div className="card-skeleton h-24" /></Card>
            ) : goals.map(goal => (
              <Card key={goal.id}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{goal.title}</div>
                      {goal.category && <div className="text-[11px] text-electric">{goal.category}</div>}
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/10 text-gray-400 uppercase tracking-wide">
                      {goal.status}
                    </span>
                  </div>
                  {goal.target_date && (
                    <div className="text-[11px] text-gray-500">Target: {goal.target_date}</div>
                  )}
                  <div className="mt-2">
                    <div className="text-[11px] text-neutral-400 mb-1">Milestones</div>
                    <div className="space-y-2">
                      {milestones.filter(m=>m.goal_id===goal.id).map(m => (
                        <div key={m.id} className="p-2 rounded border border-white/10 bg-white/5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm">{m.title}</div>
                              <div className="text-[11px] text-gray-500">{m.due_date || 'No due date'}</div>
                            </div>
                            <div className="flex gap-2 text-[11px]">
                              <button onClick={()=>updateMilestone(m.id, { status: 'pending' })} className="px-2 py-0.5 rounded bg-white/5">Pending</button>
                              <button onClick={()=>updateMilestone(m.id, { status: 'in_progress' })} className="px-2 py-0.5 rounded bg-white/5">Start</button>
                              <button onClick={()=>updateMilestone(m.id, { status: 'done' })} className="px-2 py-0.5 rounded bg-white/5">Done</button>
                            </div>
                          </div>
                          <div className="mt-2 pl-2 border-l border-white/10">
                            {subtasks.filter(s=>s.milestone_id===m.id).map(s => (
                              <div key={s.id} className="flex items-center justify-between py-1">
                                <span className="text-[12px]">• {s.title}</span>
                                <div className="flex gap-2 text-[11px]">
                                  <button onClick={()=>updateSubtask(s.id, { status: 'todo' })} className="px-2 py-0.5 rounded bg-white/5">To Do</button>
                                  <button onClick={()=>updateSubtask(s.id, { status: 'in_progress' })} className="px-2 py-0.5 rounded bg-white/5">Start</button>
                                  <button onClick={()=>updateSubtask(s.id, { status: 'done' })} className="px-2 py-0.5 rounded bg-white/5">Done</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 text-[11px]">
                    <button onClick={() => updateStatus(goal.id, 'active')} className="px-2 py-0.5 rounded bg-white/5 hover:bg-electric/10">Active</button>
                    <button onClick={() => updateStatus(goal.id, 'paused')} className="px-2 py-0.5 rounded bg-white/5 hover:bg-electric/10">Pause</button>
                    <button onClick={() => updateStatus(goal.id, 'completed')} className="px-2 py-0.5 rounded bg-white/5 hover:bg-electric/10">Done</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
