// @ts-nocheck
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAIRecorder } from '../hooks/useAIRecorder'
import Card from './Card'

export default function AIRecorderCard() {
  const [message, setMessage] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const { record, loading } = useAIRecorder()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const result = await record(message)
    setConfirmation(result.confirmation)
    
    if (result.success) {
      setMessage('')
      // Clear confirmation after 5 seconds
      setTimeout(() => setConfirmation(''), 5000)
    }
  }

  const examples = [
    "Today I weighed myself and it was 70kg",
    "I'm feeling happy today, mood 8, stress 3",
    "Spent $45 on groceries",
    "Add task: finish project report by Friday",
    "New goal: run a marathon by December"
  ]

  return (
    <Card title="🤖 AI Data Recorder">
      <div className="space-y-4">
        <p className="text-sm text-neutral-400">
          Tell me what you want to track, and I&apos;ll record it for you automatically.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Today I weighed myself and it was 70kg"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm resize-none focus:border-electric/50 focus:outline-none"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full px-4 py-2 rounded-lg bg-electric/10 border border-electric/30 hover:bg-electric/20 text-electric font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Recording...' : '📝 Record Data'}
          </button>
        </form>

        <AnimatePresence>
          {confirmation && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-electric/10 border border-electric/30"
            >
              <p className="text-sm text-electric">{confirmation}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <details className="text-xs text-neutral-500">
          <summary className="cursor-pointer hover:text-neutral-400">Example commands</summary>
          <ul className="mt-2 space-y-1 pl-4">
            {examples.map((ex, i) => (
              <li key={i} className="list-disc">&ldquo;{ex}&rdquo;</li>
            ))}
          </ul>
        </details>
      </div>
    </Card>
  )
}
