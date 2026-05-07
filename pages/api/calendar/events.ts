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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get calendar connection
    const { data: connection, error: connError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single()

    if (connError || !connection) {
      return res.status(404).json({ error: 'Calendar not connected' })
    }

    // Decrypt access token
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

    // Check if token needs refresh
    if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
      const { credentials } = await oauth2Client.refreshAccessToken()
      
      if (credentials.access_token) {
        // Update stored token
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

    // Get events for the next 7 days
    const timeMin = new Date()
    const timeMax = new Date()
    timeMax.setDate(timeMax.getDate() + 7)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime'
    })

    const events = response.data.items?.map(event => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
      attendees: event.attendees?.map(a => a.email)
    })) || []

    res.status(200).json({ events })
  } catch (error: any) {
    console.error('Calendar events error:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch calendar events' })
  }
}

function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
}
