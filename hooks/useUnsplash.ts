import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface UnsplashPhoto {
  id: string
  thumb: string
  regular: string
  alt: string
  photographer: string
  photographerUrl: string
  link: string
}

/** On-demand Unsplash photo search for the motivation board image picker. */
export function useUnsplash() {
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    if (query.trim().length < 2) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch(`/api/images/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Image search failed')
        setPhotos([])
        return
      }
      setPhotos((data.photos ?? []) as UnsplashPhoto[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { photos, loading, error, search }
}

export default useUnsplash
