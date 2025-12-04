import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useMoodLogs } from '../../hooks/useMoodLogs'
import { useAICopilot } from '../../hooks/useAICopilot'
import { useState } from 'react'

export default function MentalHealthPage(){
  const { logs, loading, addLog } = useMoodLogs()
  const { insights, analyzeMood, loading: aiLoading, error: aiError } = useAICopilot()
  const [moodLabel, setMoodLabel] = useState('')
  const [moodScore, setMoodScore] = useState('')
  const [stressScore, setStressScore] = useState('')
  const [note, setNote] = useState('')

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await addLog({ mood_label: moodLabel || undefined, mood_score: moodScore? parseInt(moodScore): undefined, stress_score: stressScore? parseInt(stressScore): undefined, note: note || undefined })
    setMoodLabel(''); setMoodScore(''); setStressScore(''); setNote('')
    if (moodLabel) analyzeMood(moodLabel)
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6 space-y-6">
          <h1 className="text-2xl font-display font-bold">Mental Health Copilot</h1>
          <Card title="Mood Check-in">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <input value={moodLabel} onChange={e=>setMoodLabel(e.target.value)} placeholder="Mood label (e.g., calm, stressed)" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
              <input type="number" min={0} max={10} value={moodScore} onChange={e=>setMoodScore(e.target.value)} placeholder="Mood score (0-10)" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
              <input type="number" min={0} max={10} value={stressScore} onChange={e=>setStressScore(e.target.value)} placeholder="Stress score (0-10)" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
              <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
              <Button variant="primary" className="text-xs w-full md:w-auto">Log</Button>
            </form>
          </Card>
          <Card title="AI Reflection">
            <div className="space-y-3">
              {aiLoading ? <div className="card-skeleton h-16"/> : insights ? (
                <div className="text-sm text-neutral-200">{insights}</div>
              ) : (
                <div className="text-sm subtle-muted">No insights yet. Log a mood to analyze.</div>
              )}
              {aiError && <div className="text-xs text-red-400">{aiError}</div>}
            </div>
          </Card>
          <Card title="Recent Logs">
            <div className="space-y-2">
              {loading ? <div className="card-skeleton h-24"/> : logs.map(l => (
                <div key={l.id} className="flex items-center justify-between p-2 rounded border border-white/10 bg-white/5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-white/10">{l.mood_label ?? '—'}</span>
                    <span>Mood: {l.mood_score ?? '—'}</span>
                    <span>Stress: {l.stress_score ?? '—'}</span>
                  </div>
                  {l.note && <span className="text-xs text-neutral-500">{l.note}</span>}
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
