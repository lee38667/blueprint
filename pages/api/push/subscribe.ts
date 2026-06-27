import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard, getServiceClient } from '../../../lib/apiAuth'

/**
 * Registers (POST) or removes (DELETE) the caller's browser PushSubscription.
 * The subscription is stored per (user, endpoint) so multiple devices work.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authGuard(req, res, { name: 'push-subscribe', rateLimit: { limit: 30, windowMs: 60_000 } })
  if (!user) return

  const supabase = getServiceClient()

  if (req.method === 'POST') {
    const { subscription } = req.body as {
      subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    }
    const endpoint = subscription?.endpoint
    const p256dh = subscription?.keys?.p256dh
    const auth = subscription?.keys?.auth
    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: 'Invalid subscription payload' })
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: (req.headers['user-agent'] as string | undefined)?.slice(0, 255) ?? null,
      },
      { onConflict: 'user_id,endpoint' }
    )

    if (error) {
      console.error('Push subscribe error:', error)
      return res.status(500).json({ error: 'Failed to save subscription' })
    }
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body as { endpoint?: string }
    let query = supabase.from('push_subscriptions').delete().eq('user_id', user.id)
    if (endpoint) query = query.eq('endpoint', endpoint)
    const { error } = await query
    if (error) {
      console.error('Push unsubscribe error:', error)
      return res.status(500).json({ error: 'Failed to remove subscription' })
    }
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
