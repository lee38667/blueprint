import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import DailyFocusCard from '../components/DailyFocusCard'
import AICopilotTester from '../components/AICopilotTester'
import ChartComponent from '../components/Chart'
import { useDashboard } from '../hooks/useDashboard'

export default function DashboardPage() {
  const { data, loading } = useDashboard()

  return (
    <div className="min-h-screen flex bg-black text-white font-sans selection:bg-electric selection:text-black">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header Section */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Dashboard</h1>
                <p className="text-minimal-gray">Overview of your systems and progress.</p>
              </div>
              <div className="text-right text-sm text-gray-500 font-mono">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* Top Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              
              <Card title="Daily Scripture" className="h-full border-neon/20">
                <div className="h-full flex flex-col justify-center">
                  <p className="text-lg italic text-white/90 font-serif leading-relaxed">"Be still, and know that I am God."</p>
                  <p className="text-sm text-neon mt-3 font-medium">— Psalm 46:10</p>
                </div>
              </Card>
              
              <div className="space-y-4">
                <DailyFocusCard />
                <AICopilotTester />
              </div>
            </div>

            {/* Gym Section */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-display font-bold text-white">Gym Summary</h2>
                <div className="h-px flex-1 bg-white/10"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="This Week" className="min-h-[200px]">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                      <span>Monday: Push</span>
                      <span className="text-teal text-xs px-2 py-1 bg-teal/10 rounded">Completed</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                      <span>Tuesday: Pull</span>
                      <span className="text-teal text-xs px-2 py-1 bg-teal/10 rounded">Completed</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded border border-electric/30">
                      <span>Wednesday: Legs</span>
                      <span className="text-electric text-xs px-2 py-1 bg-electric/10 rounded">Today</span>
                    </div>
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
