import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { sendToUser, pushConfigured } from '../../../lib/serverPush'

/**
 * Sends a push to the caller's own devices. Used to surface freshly-created
 * reminders. No-ops quietly (200) when push isn't configured or there are no
 * subscriptions, so callers can fire-and-forget.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await authGuard(req, res, { name: 'push-send', rateLimit: { limit: 60, windowMs: 60_000 } })
  if (!user) return

  if (!pushConfigured()) return res.status(200).json({ sent: 0, skipped: 'not_configured' })

  const { title, body, url, tag } = req.body as { title?: string; body?: string; url?: string; tag?: string }
  if (!title) return res.status(400).json({ error: 'title is required' })

  const sent = await sendToUser(user.id, { title, body: body ?? '', url, tag })
  return res.status(200).json({ sent })
}
