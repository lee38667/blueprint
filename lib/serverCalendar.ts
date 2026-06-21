import { google } from 'googleapis'
import { getServiceClient } from './apiAuth'
import { encryptToken, decryptToken } from './serverCrypto'

/**
 * Shared, user-scoped Google Calendar access for server routes.
 *
 * IMPORTANT: every query here is scoped by the verified user id. Never call
 * these helpers with an id that did not come from requireUser()/authGuard().
 */

export interface CalendarEvent {
  id?: string | null
  summary?: string | null
  description?: string | null
  start?: string | null
  end?: string | null
  location?: string | null
  attendees?: (string | undefined)[]
}

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

/**
 * Returns an authorized OAuth2 client for the user's Google Calendar, or null
 * if the user has no connection. Refreshes and persists the access token when
 * expired.
 */
export async function getAuthorizedClient(userId: string) {
  const supabase = getServiceClient()
  const { data: connection } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single()

  if (!connection) return null

  const client = oauthClient()
  client.setCredentials({
    access_token: decryptToken(connection.access_token),
    refresh_token: connection.refresh_token ? decryptToken(connection.refresh_token) : undefined,
  })

  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    const { credentials } = await client.refreshAccessToken()
    if (credentials.access_token) {
      await supabase
        .from('calendar_connections')
        .update({
          access_token: encryptToken(credentials.access_token),
          expires_at: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id)
    }
  }

  return client
}

/** Fetches upcoming events for the user (default next 7 days). */
export async function getUpcomingEvents(userId: string, days = 7): Promise<CalendarEvent[]> {
  const client = await getAuthorizedClient(userId)
  if (!client) return []

  const calendar = google.calendar({ version: 'v3', auth: client })
  const timeMin = new Date()
  const timeMax = new Date()
  timeMax.setDate(timeMax.getDate() + days)

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime',
  })

  return (
    response.data.items?.map((event) => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
      attendees: event.attendees?.map((a) => a.email ?? undefined),
    })) || []
  )
}

/** Builds a human-readable today / tomorrow / upcoming summary for AI prompts. */
export function formatCalendarSummary(events: CalendarEvent[]): string {
  if (!events.length) return ''

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekEnd = new Date(today.getTime() + 7 * 86400000)

  const at = (s: string | null | undefined) => (s ? new Date(s) : null)
  const time = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const todayEvents = events.filter((e) => at(e.start)?.toDateString() === today.toDateString())
  const tomorrowEvents = events.filter((e) => at(e.start)?.toDateString() === tomorrow.toDateString())
  const upcoming = events.filter((e) => {
    const d = at(e.start)
    return d && d > tomorrow && d <= weekEnd
  })

  const parts: string[] = []
  if (todayEvents.length) {
    parts.push("Today's schedule:")
    todayEvents.forEach((e) => {
      const d = at(e.start)
      parts.push(`- ${d ? time(d) : 'all day'}: ${e.summary}${e.location ? ` (${e.location})` : ''}`)
    })
  }
  if (tomorrowEvents.length) {
    parts.push('\nTomorrow:')
    tomorrowEvents.forEach((e) => {
      const d = at(e.start)
      parts.push(`- ${d ? time(d) : 'all day'}: ${e.summary}${e.location ? ` (${e.location})` : ''}`)
    })
  }
  if (upcoming.length) {
    parts.push('\nUpcoming this week:')
    upcoming.forEach((e) => {
      const d = at(e.start)
      const date = d?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      parts.push(`- ${date} ${d ? time(d) : ''}: ${e.summary}`)
    })
  }

  return parts.join('\n')
}
