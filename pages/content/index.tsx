import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import { useContentLibrary } from '../../hooks/useContentLibrary'

export default function ContentPage(){
  const { items, loading } = useContentLibrary()

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl mb-4">Content Library</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? <Card><div className="card-skeleton h-24"/></Card> : items.map((it:any)=> <Card key={it.id} title={it.title}>{it.type}</Card>)}
          </div>
        </main>
      </div>
    </div>
  )
}
