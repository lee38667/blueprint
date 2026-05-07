import type { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user from query param token, authorization header, or cookies
    const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '')
    let userId: string | null = null

    if (token) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)

      if (!userError && user) {
        userId = user.id
      }
    }

    // Fallback: try to get from cookies
    if (!userId) {
      const cookies = req.headers.cookie || ''
      const cookiePrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'sb'
      const sessionMatch = cookies.match(new RegExp(`${cookiePrefix}-[^=]+-auth-token=([^;]+)`))

      if (sessionMatch) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(sessionMatch[1]))
          userId = sessionData?.user?.id
        } catch (e) {
          console.error('Failed to parse session cookie:', e)
        }
      }
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated. Please log in first.' })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
    )

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      prompt: 'consent',
      state: userId // Pass user ID in state parameter
    })

    res.redirect(authUrl)
  } catch (error) {
    console.error('Calendar auth error:', error)
    res.status(500).json({ error: 'Failed to initiate Google Calendar authentication' })
  }
}
