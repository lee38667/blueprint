import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import { useSkills } from '../../hooks/useSkills'

export default function SkillsPage(){
  const { skills, loading } = useSkills()

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl mb-4">Skills</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? <Card><div className="card-skeleton h-24"/></Card> : skills.map((s:any)=> <Card key={s.id} title={s.name}>{s.level}</Card>)}
          </div>
        </main>
      </div>
    </div>
  )
}
