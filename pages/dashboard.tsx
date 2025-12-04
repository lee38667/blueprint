import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import DailyFocusCard from '../components/DailyFocusCard'
import AICopilotTester from '../components/AICopilotTester'
import ChartComponent from '../components/Chart'
import ScriptureCard from '../components/ScriptureCard'
import MotivationQuoteCard from '../components/MotivationQuoteCard'
import AICopilotInsightsCard from '../components/AICopilotInsightsCard'
import { useDashboard } from '../hooks/useDashboard'
import { useTasks } from '../hooks/useTasks'
import { useBodyStats } from '../hooks/useBodyStats'

export default function DashboardPage() {
  const { data, loading } = useDashboard()
  const { tasks, addTask, updateTask } = useTasks()
  const quickTasks = tasks.filter(t => t.status !== 'done').slice(0, 5)
  const { stats, addStat } = useBodyStats()
  const [weight, setWeight] = useState('')
  const [sleep, setSleep] = useState('')
  const [water, setWater] = useState('')
  const [stress, setStress] = useState('')
  const recentStats = [...stats].slice(-5).reverse()

  const handleBodySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!weight && !sleep && !water && !stress) return
    await addStat({
      weight: weight ? parseFloat(weight) : null,
      sleep_hours: sleep ? parseFloat(sleep) : null,
      water_ml: water ? parseInt(water) : null,
      stress: stress ? parseInt(stress) : null
    })
    setWeight(''); setSleep(''); setWater(''); setStress('')
  }

  return (
    <div className="min-h-screen flex text-white font-sans selection:bg-electric selection:text-black app-shell">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header Section */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="heading-xl mb-2">Dashboard</h1>
                <p className="subtle-muted">Brief overview of key modules.</p>
              </div>
              <div className="text-right text-sm text-gray-500 font-mono">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* Top Grid */}
            <div className="content-grid">
              <Card title="Financial Snapshot" className="h-full">
                {loading ? (
                  <div className="card-skeleton h-24 w-full animate-pulse" />
                ) : (
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <span className="text-sm text-gray-400">Total Balance</span>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-electric font-mono tracking-tight">
                          $ {data?.balance?.toLocaleString() ?? '0'}
                        </span>
                        <div className="text-xs text-teal flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                          <span>+2.4%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 h-24">
                      <ChartComponent 
                        data={data?.balanceHistory?.length ? data.balanceHistory : [0]} 
                        labels={data?.balanceLabels?.length ? data.balanceLabels : ['–']} 
                        color="#00E5FF" 
                        height={100}
                      />
                    </div>
                  </div>
                )}
              </Card>
              
              {/* Minimal placeholder ready for dynamic content */}
              <Card title="Quick Tasks" className="h-full">
                <div className="space-y-3">
                  {quickTasks.length === 0 ? (
                    <div className="subtle-muted">No open tasks. Add some on Tasks.</div>
                  ) : (
                    quickTasks.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-xl border border-white/10 bg-white/5">
                        <div>
                          <div className="font-medium">{t.title}</div>
                          <div className="text-xs text-neutral-500">
                            {t.project || 'General'} • {t.priority}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {t.status !== 'in_progress' && (
                            <button className="btn-glow px-3 py-1 rounded" onClick={() => updateTask(t.id, { status: 'in_progress' })}>Start</button>
                          )}
                          <button className="px-3 py-1 rounded border border-white/10" onClick={() => updateTask(t.id, { status: 'done' })}>Done</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
              
              <div className="space-y-4">
                <DailyFocusCard />
                <MotivationQuoteCard />
                <ScriptureCard />
                <AICopilotInsightsCard />
                <AICopilotTester />
              </div>
            </div>

            {/* Body Stats Quick Log */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Body Stats Quick Log">
                <form onSubmit={handleBodySubmit} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Weight" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
                  <input value={sleep} onChange={e=>setSleep(e.target.value)} placeholder="Sleep hrs" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
                  <input value={water} onChange={e=>setWater(e.target.value)} placeholder="Water ml" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
                  <input value={stress} onChange={e=>setStress(e.target.value)} placeholder="Stress" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
                  <button className="btn-glow px-4 py-2 rounded text-xs md:col-span-4">Log Stats</button>
                </form>
              </Card>
              <Card title="Recent Body Metrics">
                <div className="space-y-2">
                  {recentStats.length === 0 ? (
                    <div className="subtle-muted">No entries yet.</div>
                  ) : recentStats.map(stat => (
                    <div key={stat.id} className="flex items-center justify-between p-2 rounded border border-white/10 bg-white/5 text-sm">
                      <div>
                        <div className="font-medium">{new Date(stat.recorded_at).toLocaleDateString()}</div>
                        <div className="text-xs text-neutral-500">Weight {stat.weight ?? '—'} • Sleep {stat.sleep_hours ?? '—'} • Water {stat.water_ml ?? '—'} ml • Stress {stat.stress ?? '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            {/* Gym Section */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-display font-bold text-white">Gym Summary</h2>
                <div className="h-px flex-1 bg-white/10"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="" className="min-h[200px]">
                  <div className="h-full flex items-center justify-center subtle-muted">
                    <span>No schedule connected.</span>
                  </div>
                </Card>
                <Card title="Body Stats" className="min-h-[200px]">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <span className="text-sm text-gray-400">Current Weight</span>
                        <div className="text-3xl font-bold text-white font-mono tracking-tight">
                          {data?.weightHistory?.length ? data.weightHistory[data.weightHistory.length - 1].toFixed(1) : '—'} <span className="text-lg text-gray-500">lbs</span>
                        </div>
                      </div>
                      <div className="text-xs text-teal flex items-center gap-1 mb-1">
                        <span>-4.0 lbs</span>
                      </div>
                    </div>
                    <div className="flex-1 min-h-[100px]">
                      <ChartComponent 
                        data={data?.weightHistory?.length ? data.weightHistory : [0]} 
                        labels={data?.weightLabels?.length ? data.weightLabels : ['–']} 
                        color="#B300FF" 
                        height={100}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
