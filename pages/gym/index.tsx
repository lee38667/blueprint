import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import { useGym } from '../../hooks/useGym'

export default function GymPage() {
  const { workouts, loading } = useGym()

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl mb-4">Gym</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? <Card><div className="card-skeleton h-24"/></Card> : workouts.map((w:any)=> <Card key={w.id} title={w.name}>{w.notes}</Card>)}
          </div>
        </main>
      </div>
    </div>
  )
}
