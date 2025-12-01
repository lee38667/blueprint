import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import DailyFocusCard from '../components/DailyFocusCard'
import { useDashboard } from '../hooks/useDashboard'

export default function DashboardPage() {
  const { data, loading } = useDashboard()

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Financial Snapshot">
              {loading ? <div className="card-skeleton h-24" /> : <div>Balance: $ {data?.balance ?? '—'}</div>}
            </Card>
            <Card title="Daily Scripture">
              <div className="italic">"Be still and know..."</div>
            </Card>
            <DailyFocusCard />
          </div>
          <section className="mt-6">
            <h2 className="text-xl mb-4">Gym Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="This Week">Workout plan and summary</Card>
              <Card title="Body Stats">Graphs and trends</Card>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
