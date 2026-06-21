import type { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'
import { authGuard } from '../../../lib/apiAuth'
import { getAuthorizedClient } from '../../../lib/serverCalendar'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, {
    name: 'calendar-create-event',
    rateLimit: { limit: 30, windowMs: 60_000 },
  })
  if (!user) return

  try {
    const client = await getAuthorizedClient(user.id)
    if (!client) {
      return res.status(404).json({ error: 'Calendar not connected' })
    }

    const { summary, description, start, end, location } = req.body as {
      summary: string
      description?: string
      start: string
      end: string
      location?: string
    }

    if (!summary || !start || !end) {
      return res.status(400).json({ error: 'summary, start, and end are required' })
    }

    const calendar = google.calendar({ version: 'v3', auth: client })

    const event: any = { summary, start: {}, end: {} }

    // Detect all-day events (date-only strings like "2026-03-17")
    const isAllDay = /^\d{4}-\d{2}-\d{2}$/.test(start)
    if (isAllDay) {
      event.start.date = start
      event.end.date = end
    } else {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      event.start.dateTime = start
      event.start.timeZone = tz
      event.end.dateTime = end
      event.end.timeZone = tz
    }

    if (description) event.description = description
    if (location) event.location = location

    const response = await calendar.events.insert({ calendarId: 'primary', requestBody: event })

    res.status(200).json({
      success: true,
      event: {
        id: response.data.id,
        summary: response.data.summary,
        start: response.data.start?.dateTime || response.data.start?.date,
        end: response.data.end?.dateTime || response.data.end?.date,
        htmlLink: response.data.htmlLink,
      },
    })
  } catch (error: any) {
    console.error('Calendar create event error:', error)
    res.status(500).json({ error: 'Failed to create calendar event' })
  }
}
