import { motion } from 'framer-motion'
import Card from './Card'
import { useScripture } from '../hooks/useScripture'
import { supabase } from '../lib/supabaseClient'
import { useScriptureFavorites } from '../hooks/useScriptureFavorites'

export default function ScriptureCard() {
  const { verse, loading, error, refresh } = useScripture()
  const { favorites } = useScriptureFavorites()
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
            {favorites.length > 0 && (
              <div className="mt-3 text-xs text-neutral-400 space-y-1">
                <div className="uppercase tracking-wide text-[10px] text-neutral-500">Favorites</div>
                {favorites.slice(0,3).map(fav => (
                  <div key={fav.id} className="flex justify-between border-b border-white/5 pb-1">
                    <span>{fav.reference}</span>
                    <span className="text-neutral-500 truncate ml-2">{fav.verse.slice(0,30)}...</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}