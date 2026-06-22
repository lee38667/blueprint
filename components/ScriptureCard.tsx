import { motion, AnimatePresence } from 'framer-motion'
import Card from './Card'
import { useScripture } from '../hooks/useScripture'
import { supabase } from '../lib/supabaseClient'
import { useScriptureFavorites } from '../hooks/useScriptureFavorites'
import { useToastStore } from '../lib/toastStore'

export default function ScriptureCard() {
  const { verse, loading, error, refresh } = useScripture()
  const { favorites } = useScriptureFavorites()
  const toast = useToastStore()

  const saveFavorite = async () => {
    if (!verse?.reference) return
    const { data: auth } = await supabase.auth.getUser()
    const { error } = await supabase.from('scripture_favorites').insert({
      user_id: auth.user?.id,
      verse: verse.text,
      reference: verse.reference,
    })
    if (error) {
      toast.error('Could not save favorite')
      return
    }
    toast.success('Saved to favorites')
  }

  return (
    <Card title="Daily Scripture" className="min-h-[180px]">
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="space-y-2">
            <div className="card-skeleton h-4 w-24" />
            <div className="card-skeleton h-12 w-full" />
          </div>
        ) : (
          <>
            {/* Theme chip */}
            {verse?.theme && (
              <span
                className="self-start text-[10px] font-semibold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
                style={{
                  color: 'var(--theme-accent)',
                  background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--theme-accent) 35%, transparent)',
                }}
              >
                {verse.theme}
              </span>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={verse?.reference}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="space-y-2"
              >
                <p className="text-[15px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>
                  “{verse?.text}”
                </p>
                <p className="text-xs font-medium" style={{ color: 'var(--theme-accent)' }}>
                  {verse?.reference}
                  {verse?.translation && (
                    <span style={{ color: 'var(--theme-text-muted)' }}> · {verse.translation}</span>
                  )}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Encouraging application note */}
            {verse?.encouragement && (
              <p className="text-xs italic" style={{ color: 'var(--theme-text-dim)' }}>
                {verse.encouragement}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button onClick={refresh} className="btn-glow px-3 py-1 rounded text-xs">
                New verse
              </button>
              <button
                onClick={saveFavorite}
                className="px-3 py-1 rounded text-xs"
                style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-dim)' }}
              >
                Save
              </button>
            </div>

            {error && <span className="text-xs text-red-400">{error}</span>}

            {favorites.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="uppercase tracking-wide text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                  Favorites
                </div>
                {favorites.slice(0, 3).map((fav) => (
                  <div
                    key={fav.id}
                    className="flex justify-between text-xs pb-1"
                    style={{ borderBottom: '1px solid var(--theme-border)' }}
                  >
                    <span style={{ color: 'var(--theme-text-dim)' }}>{fav.reference}</span>
                    <span className="truncate ml-2" style={{ color: 'var(--theme-text-muted)' }}>
                      {fav.verse.slice(0, 30)}…
                    </span>
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
