import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import AICopilotInsightsCard from '../../components/AICopilotInsightsCard'
import ChartComponent from '../../components/Chart'
import { useTasks } from '../../hooks/useTasks'
import useProductivityAnalytics from '../../hooks/useProductivityAnalytics'
import { useMemo, useState } from 'react'

export default function TasksPage(){
  const { tasks, loading, addTask, updateTask, removeTask } = useTasks()
  const analytics = useProductivityAnalytics(tasks)
  const priorityTotal = Math.max(1, analytics.priorityTotals.low + analytics.priorityTotals.normal + analytics.priorityTotals.high)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'all'|'todo'|'in_progress'|'done'>('all')
  const [priority, setPriority] = useState<'all'|'low'|'normal'|'high'>('all')
  const [project, setProject] = useState<string>('all')

  const filtered = useMemo(()=>{
    return tasks.filter(t=>{
      if (status !== 'all' && t.status !== status) return false
      if (priority !== 'all' && t.priority !== priority) return false
      if (project !== 'all' && t.project !== project) return false
      return true
    })
  }, [tasks, status, priority, project])

  const weeklySummary = useMemo(()=>{
    const weekAgo = Date.now() - 7*24*60*60*1000
    const recent = tasks.filter(t => new Date(t.created_at).getTime() >= weekAgo)
    return {
      created: recent.length,
      completed: tasks.filter(t => t.status === 'done').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
    }
  }, [tasks])

  const handleAdd = async () => {
    if (!title.trim()) return
    await addTask({ title })
    setTitle('')
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6 space-y-6">
          <h1 className="text-2xl font-display font-bold">Tasks</h1>
          <Card title="Quick Add">
            <div className="flex gap-3">
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title" className="flex-1 bg-neutral-900 border border-white/10 rounded px-3 py-2 text-white" />
              <button onClick={handleAdd} className="btn-glow px-4 py-2 rounded">Add</button>
            </div>
          </Card>
          <Card title="Filters">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select value={status} onChange={e=>setStatus(e.target.value as any)} className="bg-neutral-900 border border-white/10 rounded px-3 py-2 text-white">
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select value={priority} onChange={e=>setPriority(e.target.value as any)} className="bg-neutral-900 border border-white/10 rounded px-3 py-2 text-white">
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
              <select value={project} onChange={e=>setProject(e.target.value)} className="bg-neutral-900 border border-white/10 rounded px-3 py-2 text-white">
                <option value="all">All Projects</option>
                {[...new Set(tasks.map(t=>t.project).filter(Boolean))].map(p=> (
                  <option key={p as string} value={p as string}>{p as string}</option>
                ))}
              </select>
              <button onClick={()=>{setStatus('all'); setPriority('all'); setProject('all')}} className="px-3 py-2 rounded border border-white/10">Reset</button>
            </div>
          </Card>
          <Card title="Weekly Summary">
            <div className="flex gap-6 text-sm">
              <div className="panel-glass px-4 py-3 rounded-xl border border-white/10">
                <div className="text-neutral-400">Created</div>
                <div className="text-white font-mono text-lg">{weeklySummary.created}</div>
              </div>
              <div className="panel-glass px-4 py-3 rounded-xl border border-white/10">
                <div className="text-neutral-400">In Progress</div>
                <div className="text-white font-mono text-lg">{weeklySummary.inProgress}</div>
              </div>
              <div className="panel-glass px-4 py-3 rounded-xl border border-white/10">
                <div className="text-neutral-400">Completed</div>
                <div className="text-white font-mono text-lg">{weeklySummary.completed}</div>
              </div>
            </div>
          </Card>
          <Card title="Productivity Pulse">
            {tasks.length === 0 ? (
              <div className="text-sm subtle-muted">Add tasks to unlock analytics.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase text-neutral-500 mb-1">Completion Rate</p>
                    <div className="text-4xl font-display text-white">{analytics.completionRate}%</div>
                    <p className="text-xs text-neutral-400">{analytics.activeCount} active • {analytics.overdueCount} overdue</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-neutral-500 mb-1">Priority mix</p>
                    <div className="space-y-2 text-xs">
                      {(['high','normal','low'] as const).map((priority) => (
                        <div key={priority} className="space-y-1">
                          <div className="flex justify-between text-neutral-400">
                            <span className="capitalize">{priority}</span>
                            <span>{analytics.priorityTotals[priority]}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/5">
                            <div
                              className={`h-full rounded-full ${priority === 'high' ? 'bg-red-400' : priority === 'normal' ? 'bg-electric' : 'bg-teal'}`}
                              style={{ width: `${Math.round((analytics.priorityTotals[priority] / priorityTotal) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase text-neutral-500 mb-2">Weekly creation trend</p>
                    <ChartComponent data={analytics.weeklyVelocity} labels={analytics.weeklyLabels} color="#0AEFFF" height={160} />
                  </div>
                  <div>
                    <p className="text-xs uppercase text-neutral-500 mb-2">Focus projects</p>
                    {analytics.focusProjects.length === 0 ? (
                      <div className="text-sm subtle-muted">No projects tagged yet.</div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        {analytics.focusProjects.map((project) => (
                          <div key={project.name} className="flex items-center justify-between px-3 py-2 rounded border border-white/10 bg-white/5">
                            <span>{project.name}</span>
                            <span className="font-mono text-neutral-400">{project.count} tasks</span>
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
            <Card><div className="card-skeleton h-24"/></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(t => (
                <Card key={t.id} title={t.title}>
                  <div className="text-sm text-neutral-400">{t.description ?? ''}</div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10">{t.priority}</span>
                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10">{t.status}</span>
                    {t.project && <span className="px-2 py-1 rounded bg-white/5 border border-white/10">{t.project}</span>}
                    {t.due_date && <span className="px-2 py-1 rounded bg-white/5 border border-white/10">due {t.due_date}</span>}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={()=>updateTask(t.id, { status: 'in_progress' })} className="btn-glow px-3 py-1 rounded">Start</button>
                    <button onClick={()=>updateTask(t.id, { status: 'done' })} className="btn-glow px-3 py-1 rounded">Done</button>
                    <button onClick={()=>removeTask(t.id)} className="px-3 py-1 rounded border border-white/10">Delete</button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
