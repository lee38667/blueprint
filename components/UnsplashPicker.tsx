import { useState } from 'react'
import { useUnsplash, type UnsplashPhoto } from '../hooks/useUnsplash'
import Button from './Button'

interface Props {
  onPick: (photo: UnsplashPhoto) => void
}

/** Inline Unsplash search grid; clicking a photo hands it back to the parent. */
export default function UnsplashPicker({ onPick }: Props) {
  const { photos, loading, error, search } = useUnsplash()
  const [query, setQuery] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    search(query)
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search inspiring images (e.g., mountains, ocean)"
          className="input-base flex-1"
        />
        <Button type="submit" variant="outline" loading={loading}>Search</Button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p)}
              className="relative aspect-square rounded-lg overflow-hidden group"
              title={`Photo by ${p.photographer} on Unsplash`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumb} alt={p.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
