import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAIRecorder } from '../hooks/useAIRecorder'
import { useAICopilot } from '../hooks/useAICopilot'
import Card from './Card'
import Button from './Button'

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function dayPart(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 22) return 'evening'
  return 'night'
}

export default function AICopilotCard() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'record' | 'chat'>('record')
  const [confirmation, setConfirmation] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [notificationPermission, setNotificationPermission] = useState<string>(() => (
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  ))

  const { record, loading: recordLoading } = useAIRecorder()
  const { insights, loading: chatLoading, error, analyzeMood, focusToday } = useAICopilot()

  const loading = recordLoading || chatLoading

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  const pulseText = useMemo(() => {
    const part = dayPart(now)
    if (part === 'morning') return 'Morning system pulse: start one important task before the day fragments.'
    if (part === 'afternoon') return 'Afternoon pulse: protect focus and prevent drift before your energy slides.'
    if (part === 'evening') return 'Evening pulse: close loops gently and set up tomorrow.'
    return 'Night pulse: offload what is still open and let recovery win.'
  }, [now])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!input.trim()) return

    if (mode === 'record') {
      const result = await record(input)
      setConfirmation(result.confirmation)
      if (result.success) {
        setInput('')
        setTimeout(() => setConfirmation(''), 5000)
      }
    } else {
      await analyzeMood(`${input}. Current local time: ${formatClock(now)}.`)
    }
  }

  const requestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
  }

  const askRightNow = async () => {
    await focusToday(`Time-aware system check-in for ${dayPart(now)} at ${formatClock(now)}`)
  }

  return (
    <Card title="Blueprint AI" className="border-neon/40 h-full" subtitle={`Aware of the current ${dayPart(now)} flow - ${formatClock(now)}`}>
      <div className="space-y-4">
        <div className="rounded-xl p-3" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>System pulse</p>
          <p className="text-sm" style={{ color: 'var(--theme-text)' }}>{pulseText}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMode('record')}
            className={`flex-1 min-w-[120px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === 'record' ? 'bg-electric/20 border border-electric/50 text-electric' : 'bg-black/40 border border-white/10 text-neutral-400 hover:text-neutral-300'}`}
          >
            Record data
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`flex-1 min-w-[120px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === 'chat' ? 'bg-neon/20 border border-neon/50 text-neon' : 'bg-black/40 border border-white/10 text-neutral-400 hover:text-neutral-300'}`}
          >
            Get advice
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={askRightNow} disabled={loading}>What matters now?</Button>
          {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
            <Button variant="outline" size="sm" onClick={requestNotifications}>Enable reminders</Button>
          )}
          {notificationPermission === 'granted' && <span className="badge badge-success">Notifications on</span>}
        </div>

        <p className="text-xs text-neutral-400">
          {mode === 'record'
            ? 'Tell me what happened and I will store it in the right place.'
            : 'Talk to me like the system is alive. I will answer using your current time, schedule, and recorded data.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={mode === 'record' ? 'e.g., Add task: pay water bill tomorrow' : 'e.g., It is 3pm and I am drifting. What should I do right now?'}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm resize-none focus:border-electric/50 focus:outline-none"
            disabled={loading}
          />

          <Button variant="primary" className="w-full text-xs" disabled={loading || !input.trim()}>
            {loading ? 'Processing...' : mode === 'record' ? 'Record' : 'Ask Blueprint AI'}
          </Button>
        </form>

        <AnimatePresence>
          {confirmation && mode === 'record' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-3 rounded-lg bg-electric/10 border border-electric/30">
              <p className="text-xs text-electric">{confirmation}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && mode === 'chat' && <p className="text-xs text-red-400">{error}</p>}

        {insights && mode === 'chat' && !error && (
          <div className="p-3 rounded-lg bg-neon/10 border border-neon/30">
            <p className="text-sm text-neutral-300 leading-relaxed">{insights}</p>
          </div>
        )}

        {mode === 'record' && (
          <details className="text-xs text-neutral-500">
            <summary className="cursor-pointer hover:text-neutral-400">Examples</summary>
            <ul className="mt-2 space-y-1 pl-4 text-[11px]">
              <li className="list-disc">Add task: finish report before 4pm</li>
              <li className="list-disc">I am stressed, mood 4, stress 8</li>
              <li className="list-disc">Spent $45 on groceries</li>
              <li className="list-disc">New goal: finish portfolio this month</li>
            </ul>
          </details>
        )}
      </div>
    </Card>
  )
}
