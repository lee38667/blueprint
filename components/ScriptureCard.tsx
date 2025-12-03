import { motion } from 'framer-motion'
import Card from './Card'
import { useScripture } from '../hooks/useScripture'
import { supabase } from '../lib/supabaseClient'

export default function ScriptureCard() {
  const { verse, loading, error, refresh } = useScripture()
  const saveFavorite = async () => {
    if (!verse || !verse.reference) return
    const { error } = await supabase.from('scripture_favorites').insert({ verse: verse.text, reference: verse.reference })
    if (error) console.error(error)
  }
  return (
    <Card title="Daily Scripture" className="min-h-[160px]">
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="card-skeleton h-12 w-full" />
        ) : (
          <>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-neutral-200">
              {verse?.text}
            </motion.p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">{verse?.reference}</span>
              <button onClick={refresh} className="btn-glow px-3 py-1 rounded">Refresh</button>
            </div>
              <button onClick={saveFavorite} className="px-3 py-1 rounded border border-white/10">Save Favorite</button>
            {error && <span className="text-xs text-red-400">{error}</span>}
          </>
        )}
      </div>
    </Card>
  )
}