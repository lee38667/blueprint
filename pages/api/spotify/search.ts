import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { searchPlaylists, spotifyConfigured } from '../../../lib/serverSpotify'

/** Proxies Spotify playlist search (keeps the client secret server-side). */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = await authGuard(req, res, { name: 'spotify-search', rateLimit: { limit: 40, windowMs: 60_000 } })
  if (!user) return

  if (!spotifyConfigured()) {
    return res.status(503).json({ error: 'Spotify is not configured (missing client credentials).' })
  }

  const playlists = await searchPlaylists((req.query.q as string) || '')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=1800')
  return res.status(200).json({ playlists })
}
