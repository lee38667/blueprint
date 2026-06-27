import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { sendToUser, pushConfigured } from '../../../lib/serverPush'

/** Sends a test notification to the caller's own subscriptions. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await authGuard(req, res, { name: 'push-test', rateLimit: { limit: 10, windowMs: 60_000 } })
  if (!user) return

  if (!pushConfigured()) {
    return res.status(503).json({ error: 'Push is not configured (missing VAPID keys).' })
  }

  const sent = await sendToUser(user.id, {
    title: 'Blueprint',
    body: 'Push notifications are working. 🎉',
    url: '/dashboard',
    tag: 'push-test',
  })

  if (sent === 0) {
    return res.status(404).json({ error: 'No active subscriptions for this device. Enable notifications first.' })
  }
  return res.status(200).json({ sent })
}
