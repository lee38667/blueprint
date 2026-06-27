import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { searchExercises } from '../../../lib/wger'

/** Proxies wger exercise search (keeps it server-side + rate-limited). */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = await authGuard(req, res, { name: 'exercise-search', rateLimit: { limit: 60, windowMs: 60_000 } })
  if (!user) return

  const term = (req.query.q as string) || ''
  const exercises = await searchExercises(term)
  // Cache identical queries briefly at the CDN.
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200')
  return res.status(200).json({ exercises })
}
