import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import { useLifeArea } from '../../hooks/useLifeArea'

export default function LifeAreasPage() {
  const { lifeAreas, loading } = useLifeArea()

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl mb-4">Life Areas</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              <Card><div className="card-skeleton h-20" /></Card>
            ) : (
              lifeAreas.map((a: any) => (
                <Card key={a.id} title={a.name}>{a.description}</Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
