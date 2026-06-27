/**
 * Unsplash image search (https://unsplash.com/developers). Requires a free
 * UNSPLASH_ACCESS_KEY. Calls stay server-side so the key is never exposed and we
 * can attach the attribution Unsplash's API terms require.
 */

const BASE = 'https://api.unsplash.com'

export interface UnsplashPhoto {
  id: string
  thumb: string
  regular: string
  alt: string
  photographer: string
  photographerUrl: string
  link: string
}

export function unsplashConfigured(): boolean {
  return !!process.env.UNSPLASH_ACCESS_KEY
}

/** Searches Unsplash photos by query. Returns [] if unconfigured or on failure. */
export async function searchPhotos(query: string, perPage = 12): Promise<UnsplashPhoto[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  const q = query.trim()
  if (!key || q.length < 2) return []

  try {
    const url = `${BASE}/search/photos?query=${encodeURIComponent(q)}&per_page=${perPage}&content_filter=high`
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
    })
    if (!res.ok) return []

    const json = (await res.json()) as {
      results?: Array<{
        id: string
        alt_description?: string | null
        urls?: { thumb?: string; regular?: string }
        user?: { name?: string; links?: { html?: string } }
        links?: { html?: string }
      }>
    }

    return (json.results ?? []).map((p) => ({
      id: p.id,
      thumb: p.urls?.thumb ?? '',
      regular: p.urls?.regular ?? '',
      alt: p.alt_description ?? q,
      photographer: p.user?.name ?? 'Unknown',
      photographerUrl: p.user?.links?.html ?? 'https://unsplash.com',
      link: p.links?.html ?? 'https://unsplash.com',
    }))
  } catch (err) {
    console.error('Unsplash search error:', err)
    return []
  }
}
