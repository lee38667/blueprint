import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { searchPhotos, unsplashConfigured } from '../../../lib/unsplash'

/** Proxies Unsplash photo search (keeps the access key server-side). */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = await authGuard(req, res, { name: 'images-search', rateLimit: { limit: 40, windowMs: 60_000 } })
  if (!user) return

  if (!unsplashConfigured()) {
    return res.status(503).json({ error: 'Image search is not configured (missing UNSPLASH_ACCESS_KEY).' })
  }

  const photos = await searchPhotos((req.query.q as string) || '')
  return res.status(200).json({ photos })
}
