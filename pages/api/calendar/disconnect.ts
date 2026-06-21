import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard, getServiceClient } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, { name: 'calendar-disconnect' })
  if (!user) return

  try {
    const { error } = await getServiceClient()
      .from('calendar_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google')

    if (error) {
      return res.status(500).json({ error: 'Failed to disconnect calendar' })
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Calendar disconnect error:', error)
    res.status(500).json({ error: 'Failed to disconnect calendar' })
  }
}
