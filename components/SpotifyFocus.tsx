import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import Card from './Card'
import Button from './Button'

interface Playlist {
  id: string
  name: string
  description: string
  owner: string
  image: string | null
  url: string
}

const STORAGE_KEY = 'blueprint:focus-playlist'

/**
 * Focus / worship playlist embed. Searches Spotify (read-only, no login) and
 * embeds the chosen playlist. The selection is remembered locally so it sticks
 * between visits. Renders nothing if Spotify isn't configured (503).
 */
export default function SpotifyFocus() {
  const [query, setQuery] = useState('worship focus')
  const [results, setResults] = useState<Playlist[]>([])
  const [selected, setSelected] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setSelected(JSON.parse(saved))
    } catch {
      /* ignore */
    }
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.status === 503) {
        setUnavailable(true)
        return
      }
      if (!res.ok) return
      const data = await res.json()
      setResults((data.playlists ?? []) as Playlist[])
    } finally {
      setLoading(false)
    }
  }, [])

  const pick = (p: Playlist) => {
    setSelected(p)
    setSearching(false)
    setResults([])
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch {
      /* ignore */
    }
  }

  if (unavailable) return null

  return (
    <Card title="Focus Sounds" subtitle="A playlist for deep work or worship.">
      {selected && !searching ? (
        <div className="space-y-3">
          <iframe
            title={selected.name}
            src={`https://open.spotify.com/embed/playlist/${selected.id}`}
            width="100%"
            height="352"
            frameBorder={0}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ borderRadius: 12 }}
          />
          <Button variant="ghost" size="sm" onClick={() => setSearching(true)}>Change playlist</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              search(query)
            }}
            className="flex gap-2"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search playlists (focus, worship, lo-fi…)"
              className="input-base flex-1"
            />
            <Button type="submit" variant="outline" loading={loading}>Search</Button>
            {selected && (
              <Button type="button" variant="ghost" onClick={() => setSearching(false)}>Cancel</Button>
            )}
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => pick(p)}
                className="flex items-center gap-3 p-2 rounded-lg text-left hover:bg-[var(--theme-surface)]"
                style={{ border: '1px solid var(--theme-border)' }}
              >
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>{p.name}</span>
                  <span className="block text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>by {p.owner}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
