import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useMoodLogs } from '../../hooks/useMoodLogs'
import { useAICopilot } from '../../hooks/useAICopilot'
import useMentalCoach from '../../hooks/useMentalCoach'
import { useState } from 'react'

export default function MentalHealthPage(){
  const { logs, loading, addLog } = useMoodLogs()
  const { insights, analyzeMood, loading: aiLoading, error: aiError } = useAICopilot()
  const { data: coach, heuristics, loading: coachLoading, error: coachError } = useMentalCoach(logs)
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
          <Card title="Encouragement & Burnout Watch">
            {coachLoading ? (
              <div className="space-y-3">
                <div className="card-skeleton h-16" />
                <div className="card-skeleton h-10" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-sm subtle-muted">Log a few moods to unlock proactive encouragement.</div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-neutral-100 leading-relaxed">{coach?.encouragement ?? 'Keep checking in—these reflections are building resilience.'}</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className={`px-3 py-1 rounded-full border border-white/10 ${coach?.burnoutRisk === 'high' ? 'bg-red-500/10 text-red-300' : coach?.burnoutRisk === 'medium' ? 'bg-yellow-500/10 text-yellow-200' : 'bg-teal/10 text-teal'}`}>
                    Burnout risk: {coach?.burnoutRisk ?? 'low'}
                  </span>
                  <span className="px-3 py-1 rounded-full border border-white/10 text-neutral-300">
                    Avg mood: {heuristics.avgMood ?? '—'}
                  </span>
                  <span className="px-3 py-1 rounded-full border border-white/10 text-neutral-300">
                    Avg stress: {heuristics.avgStress ?? '—'}
                  </span>
                  {heuristics.negativeStreak >= 3 && (
                    <span className="px-3 py-1 rounded-full border border-red-500/30 text-red-300">{heuristics.negativeStreak} day concern streak</span>
                  )}
                </div>
                {heuristics.burnoutLikely && (
                  <div className="text-xs text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2">
                    Elevated stress paired with low mood detected. Consider scheduling a deeper rest window.
                  </div>
                )}
                {coach?.actions?.length ? (
                  <div>
                    <p className="text-xs uppercase text-neutral-500 mb-2 tracking-wide">Suggested focus</p>
                    <ul className="text-sm text-neutral-200 space-y-2">
                      {coach.actions.map((action, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-electric">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {coach?.regulationTips?.length ? (
                  <div>
                    <p className="text-xs uppercase text-neutral-500 mb-2 tracking-wide">Grounding steps</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {coach.regulationTips.map((tip, idx) => (
                        <span key={idx} className="px-3 py-1 rounded bg-white/5 border border-white/10 text-neutral-200">{tip}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {coachError && <div className="text-xs text-red-400">{coachError}</div>}
              </div>
            )}
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
