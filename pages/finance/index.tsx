import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import { useFinance } from '../../hooks/useFinance'

export default function FinancePage(){
  const { summary, loading } = useFinance()

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl mb-4">Finance</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Savings">{loading ? <div className="card-skeleton h-24"/> : `Savings: $${summary?.savings ?? '—'}`}</Card>
            <Card title="Debt">{loading ? <div className="card-skeleton h-24"/> : `Debt: $${summary?.debt ?? '—'}`}</Card>
          </div>
        </main>
      </div>
    </div>
  )
}
