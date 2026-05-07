import { useEffect, useMemo, useRef, useState } from 'react'
import Card from './Card'
import Button from './Button'
import { getEnergyProfile } from '../lib/focusEngine'
import type { AISnapshot } from '../lib/aiSnapshot'

interface Props {
  snapshot: Pick<AISnapshot, 'moods' | 'bodyStats'>
  rewardMessage?: string
}

type Mode = 'reset' | 'pomodoro' | 'body-double'

function speak(message: string) {
  if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') return
  const utterance = new SpeechSynthesisUtterance(message)
  utterance.rate = 0.95
  utterance.pitch = 1
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export default function FocusSessionCard({ snapshot, rewardMessage }: Props) {
  const profile = useMemo(() => getEnergyProfile(snapshot), [snapshot])
  const [mode, setMode] = useState<Mode>('pomodoro')
  const [phase, setPhase] = useState<'idle' | 'focus' | 'break'>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const halfwaySpokenRef = useRef(false)

  const durations = useMemo(() => {
    const focusBase = mode === 'reset' ? 5 : mode === 'body-double' ? Math.max(10, profile.focusMinutes) : Math.max(15, profile.focusMinutes)
    return {
      focus: focusBase * 60,
      break: profile.breakMinutes * 60,
    }
  }, [mode, profile.breakMinutes, profile.focusMinutes])

  useEffect(() => {
    if (phase === 'idle' || secondsLeft <= 0) return
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => current - 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase, secondsLeft])

  useEffect(() => {
    if (phase === 'focus' && secondsLeft <= 0) {
      setPhase('break')
      setSecondsLeft(durations.break)
      halfwaySpokenRef.current = false
      speak(`Nice work. Break for ${Math.round(durations.break / 60)} minutes. ${rewardMessage || 'You earned a reset.'}`)
      return
    }

    if (phase === 'break' && secondsLeft <= 0) {
      setPhase('idle')
      setSecondsLeft(0)
      halfwaySpokenRef.current = false
      speak('Break complete. Restart with the smallest next step.')
      return
    }

    if (phase === 'focus' && !halfwaySpokenRef.current && secondsLeft <= durations.focus / 2) {
      halfwaySpokenRef.current = true
      if (mode === 'body-double') {
        speak('Quick check-in: stay with the next tiny visible move. You do not need the whole plan right now.')
      }
    }
  }, [durations.break, durations.focus, mode, phase, rewardMessage, secondsLeft])

  const startSession = (nextMode: Mode) => {
    setMode(nextMode)
    setPhase('focus')
    setSecondsLeft(nextMode === 'reset' ? 5 * 60 : nextMode === 'body-double' ? Math.max(10, profile.focusMinutes) * 60 : Math.max(15, profile.focusMinutes) * 60)
    halfwaySpokenRef.current = false
    speak(
      nextMode === 'body-double'
        ? `Body doubling started. We are focusing for ${Math.max(10, profile.focusMinutes)} minutes. Begin with the smallest visible step.`
        : `Focus session started for ${nextMode === 'reset' ? 5 : Math.max(15, profile.focusMinutes)} minutes.`
    )
  }

  const stopSession = () => {
    setPhase('idle')
    setSecondsLeft(0)
    halfwaySpokenRef.current = false
    if (typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined') {
      window.speechSynthesis.cancel()
    }
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  return (
    <Card title="Focus Session" subtitle={`Energy: ${profile.label}`}>
      <div className="space-y-4">
        <div className="rounded-xl p-3" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>Adaptive pacing</p>
          <p className="text-sm" style={{ color: 'var(--theme-text)' }}>
            Recommended sprint: {profile.focusMinutes} minutes. Suggested break: {profile.breakMinutes} minutes.
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--theme-text-dim)' }}>
            Mood {profile.avgMood?.toFixed(1) ?? '-'} � Stress {profile.avgStress?.toFixed(1) ?? '-'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => startSession('reset')}>5 min reset</Button>
          <Button variant="primary" size="sm" onClick={() => startSession('pomodoro')}>Pomodoro</Button>
          <Button variant="outline" size="sm" onClick={() => startSession('body-double')}>Body double</Button>
          {phase !== 'idle' && <Button variant="ghost" size="sm" onClick={stopSession}>Stop</Button>}
        </div>

        <div className="rounded-2xl p-4 text-center" style={{ background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-accent) 25%, transparent)' }}>
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>
            {phase === 'break' ? 'Break' : phase === 'focus' ? (mode === 'body-double' ? 'Body double' : 'Focus sprint') : 'Ready'}
          </p>
          <div className="text-4xl font-display font-bold" style={{ color: 'var(--theme-text)' }}>
            {phase === 'idle' ? '--:--' : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--theme-text-dim)' }}>
            {phase === 'idle'
              ? 'Use spoken prompts and tiny starts to reduce initiation friction.'
              : phase === 'break'
                ? 'Step away, breathe, and come back before the scroll spiral starts.'
                : 'Only do the next tiny visible move.'}
          </p>
        </div>
      </div>
    </Card>
  )
}
