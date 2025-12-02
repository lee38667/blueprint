import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useGym } from '../../hooks/useGym'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function GymPage() {
  const { workouts, loading } = useGym()
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!weight) return
    setSaving(true)
    try {
      await supabase.from('workout_logs').insert({
        metrics: { weight: parseFloat(weight) },
        notes: notes || null
      })
      setWeight('')
      setNotes('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl mb-4">Gym</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Log Weight">
              <form onSubmit={handleLog} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Weight (lbs)</label>
                  <input
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    type="number"
                    step="0.1"
                    className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric resize-none"
                  />
                </div>
                <Button 
                  variant="primary" 
                  className={`w-full text-xs ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={() => {}}
                >
                  {saving ? 'Saving…' : 'Save Log'}
                </Button>
              </form>
            </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? <Card><div className="card-skeleton h-24"/></Card> : workouts.map((w:any)=> <Card key={w.id} title={w.name}>{w.notes}</Card>)}
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}
