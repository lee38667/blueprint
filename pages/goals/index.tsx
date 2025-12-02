import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useGoals } from '../../hooks/useGoals'
import { useState } from 'react'

export default function GoalsPage(){
  const { goals, loading, addGoal, updateStatus } = useGoals()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [targetDate, setTargetDate] = useState('')

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
