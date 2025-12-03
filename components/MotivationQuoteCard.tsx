import Card from './Card'
import { useQuotes } from '../hooks/useQuotes'
import { motion } from 'framer-motion'

export default function MotivationQuoteCard() {
  const { quote, loading, error, refresh } = useQuotes()
  return (
    <Card title="Motivation" className="min-h-[160px]">
      {loading ? (
        <div className="card-skeleton h-12 w-full" />
      ) : (
        <div className="flex flex-col gap-3">
          <motion.blockquote initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-neutral-200">
            “{quote?.text}”
          </motion.blockquote>
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">— {quote?.author}</span>
            <button onClick={refresh} className="btn-glow px-3 py-1 rounded">New Quote</button>
          </div>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      )}
    </Card>
  )
}