import { useState } from 'react'
import Card from './Card'
import Button from './Button'
import { useAICopilot } from '../hooks/useAICopilot'

export default function AICopilotTester(){
  const [mood, setMood] = useState('')
  const { insights, loading, error, analyzeMood } = useAICopilot()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    analyzeMood(mood)
  }

  return (
    <Card title="AI Copilot" className="border-neon/40">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">How are you feeling?</label>
          <input
            value={mood}
            onChange={e => setMood(e.target.value)}
            placeholder="e.g. a bit overwhelmed but motivated"
            className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
          />
        </div>
        <Button variant="primary" className="text-xs" disabled={loading || !mood.trim()}>
          {loading ? 'Thinking…' : 'Ask Copilot'}
        </Button>
      </form>
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      {insights && !error && (
        <p className="mt-3 text-sm text-minimal-gray leading-relaxed">{insights}</p>
      )}
    </Card>
  )
}
