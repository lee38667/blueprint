import type { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import CryptoJS from 'crypto-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-change-in-production'

function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const { data: connection, error: connError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single()

    if (connError || !connection) {
      return res.status(404).json({ error: 'Calendar not connected' })
    }

    const accessToken = decrypt(connection.access_token)

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: connection.refresh_token ? decrypt(connection.refresh_token) : undefined
    })

    // Refresh token if expired
    if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
      const { credentials } = await oauth2Client.refreshAccessToken()

      if (credentials.access_token) {
        await supabase
          .from('calendar_connections')
          .update({
            access_token: encrypt(credentials.access_token),
            expires_at: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', connection.id)
      }
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

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

    const event: any = {
      summary,
      start: {},
      end: {},
    }

    // Detect all-day events (date-only strings like "2026-03-17")
    const isAllDay = /^\d{4}-\d{2}-\d{2}$/.test(start)

    if (isAllDay) {
      event.start.date = start
      event.end.date = end
    } else {
      event.start.dateTime = start
      event.start.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      event.end.dateTime = end
      event.end.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    }

    if (description) event.description = description
    if (location) event.location = location

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    })

    res.status(200).json({
      success: true,
      event: {
        id: response.data.id,
        summary: response.data.summary,
        start: response.data.start?.dateTime || response.data.start?.date,
        end: response.data.end?.dateTime || response.data.end?.date,
        htmlLink: response.data.htmlLink,
      }
    })
  } catch (error: any) {
    console.error('Calendar create event error:', error)
    res.status(500).json({ error: error.message || 'Failed to create calendar event' })
  }
}
