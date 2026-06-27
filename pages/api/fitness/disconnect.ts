import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard, getServiceClient } from '../../../lib/apiAuth'

/** Removes the user's Google Fit connection (keeps already-synced samples). */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })

  const user = await authGuard(req, res, { name: 'fitness-disconnect' })
  if (!user) return

  const { error } = await getServiceClient()
    .from('fitness_connections')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'google_fit')

  if (error) {
    console.error('Fitness disconnect error:', error)
    return res.status(500).json({ error: 'Failed to disconnect Google Fit' })
  }
  res.status(200).json({ success: true })
}
