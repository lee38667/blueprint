import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useMoodLogs } from '../../hooks/useMoodLogs'
import { useAICopilot } from '../../hooks/useAICopilot'
import useMentalCoach from '../../hooks/useMentalCoach'
import { CardSkeleton, LineSkeleton } from '../../components/Skeleton'
import { useState } from 'react'

export default function MentalHealthPage() {
  const { logs, loading, addLog } = useMoodLogs()
  const { insights, analyzeMood, loading: aiLoading, error: aiError } = useAICopilot()
  const { data: coach, heuristics, loading: coachLoading, error: coachError } = useMentalCoach(logs)
  const [moodLabel, setMoodLabel] = useState('')
  const [moodScore, setMoodScore] = useState('')
  const [stressScore, setStressScore] = useState('')
  const [note, setNote] = useState('')

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await addLog({
      mood_label: moodLabel || undefined,
      mood_score: moodScore ? parseInt(moodScore) : undefined,
      stress_score: stressScore ? parseInt(stressScore) : undefined,
      note: note || undefined,
    })
    setMoodLabel('')
    setMoodScore('')
    setStressScore('')
    setNote('')
    if (moodLabel) analyzeMood(moodLabel)
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        <h1 className="heading-xl">Mental Health Copilot</h1>

        <Card title="Mood Check-in">
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <input value={moodLabel} onChange={(e) => setMoodLabel(e.target.value)} placeholder="Mood (e.g., calm)" className="input-base" />
            <input type="number" min={0} max={10} value={moodScore} onChange={(e) => setMoodScore(e.target.value)} placeholder="Mood (0-10)" className="input-base" />
            <input type="number" min={0} max={10} value={stressScore} onChange={(e) => setStressScore(e.target.value)} placeholder="Stress (0-10)" className="input-base" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="input-base" />
            <Button variant="primary" className="text-xs w-full" type="submit">Log</Button>
          </form>
        </Card>

        <Card title="Encouragement & Burnout Watch">
          {coachLoading ? (
            <div className="space-y-3">
              <CardSkeleton className="h-16" />
              <LineSkeleton />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-sm subtle-muted">Log a few moods to unlock proactive encouragement.</div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text)' }}>
                {coach?.encouragement ?? 'Keep checking in-these reflections are building resilience.'}
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span
                  className="px-3 py-1 rounded-full"
                  style={{
                    border: '1px solid var(--theme-border)',
                    background: coach?.burnoutRisk === 'high' ? 'rgba(239,68,68,0.1)' : coach?.burnoutRisk === 'medium' ? 'rgba(234,179,8,0.1)' : 'rgba(20,184,166,0.1)',
                    color: coach?.burnoutRisk === 'high' ? '#fca5a5' : coach?.burnoutRisk === 'medium' ? '#fde68a' : 'var(--theme-accent)',
                  }}
                >
                  Burnout risk: {coach?.burnoutRisk ?? 'low'}
                </span>
                <span className="px-3 py-1 rounded-full" style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-dim)' }}>
                  Avg mood: {heuristics.avgMood ?? '-'}
                </span>
                <span className="px-3 py-1 rounded-full" style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-dim)' }}>
                  Avg stress: {heuristics.avgStress ?? '-'}
                </span>
                {heuristics.negativeStreak >= 3 && (
                  <span className="px-3 py-1 rounded-full border border-red-500/30 text-red-300">
                    {heuristics.negativeStreak} day concern streak
                  </span>
                )}
              </div>
              {heuristics.burnoutLikely && (
                <div className="text-xs text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2">
                  Elevated stress paired with low mood detected. Consider scheduling a deeper rest window.
                </div>
              )}
              {coach?.actions?.length ? (
                <div>
                  <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>Suggested focus</p>
                  <ul className="text-sm space-y-2" style={{ color: 'var(--theme-text-dim)' }}>
                    {coach.actions.map((action: string, idx: number) => (
                      <li key={idx} className="flex gap-2">
                        <span style={{ color: 'var(--theme-accent)' }}>&bull;</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {coach?.regulationTips?.length ? (
                <div>
                  <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>Grounding steps</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {coach.regulationTips.map((tip: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 rounded" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-dim)' }}>{tip}</span>
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
            {aiLoading ? <CardSkeleton className="h-16" /> : insights ? (
              <div className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>{insights}</div>
            ) : (
              <div className="text-sm subtle-muted">No insights yet. Log a mood to analyze.</div>
            )}
            {aiError && <div className="text-xs text-red-400">{aiError}</div>}
          </div>
        </Card>

        <Card title="Recent Logs">
          <div className="space-y-2">
            {loading ? <CardSkeleton className="h-24" /> : logs.map((l) => (
              <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded text-sm" style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2 py-0.5 rounded badge">{l.mood_label ?? '-'}</span>
                  <span>Mood: {l.mood_score ?? '-'}</span>
                  <span>Stress: {l.stress_score ?? '-'}</span>
                </div>
                {l.note && <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{l.note}</span>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
