import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { getUpcomingEvents } from '../../../lib/serverCalendar'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, { name: 'calendar-events' })
  if (!user) return

  try {
    const events = await getUpcomingEvents(user.id)
    res.status(200).json({ events })
  } catch (error: any) {
    console.error('Calendar events error:', error)
    res.status(500).json({ error: 'Failed to fetch calendar events' })
  }
}
