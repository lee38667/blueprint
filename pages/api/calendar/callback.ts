import type { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'
import { getServiceClient } from '../../../lib/apiAuth'
import { encryptToken } from '../../../lib/serverCrypto'

const supabase = getServiceClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, state } = req.query

  if (!code || typeof code !== 'string') {
    return res.redirect('/settings?calendar_error=no_code')
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
    )

    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.access_token) {
      return res.redirect('/settings?calendar_error=no_token')
    }

    // Get user from state parameter (passed during auth initiation)
    let userId: string | null = null
    
    if (state && typeof state === 'string') {
      try {
        // State should contain the user_id
        userId = state
      } catch (e) {
        console.error('Failed to parse state:', e)
      }
    }

    // If no state, try to get from cookies as fallback
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
      return res.redirect('/settings?calendar_error=not_authenticated')
    }

    // Store encrypted tokens in database
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null

    const { error: dbError } = await supabase
      .from('calendar_connections')
      .upsert({
        user_id: userId,
        provider: 'google',
        access_token: encryptToken(tokens.access_token),
        refresh_token: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return res.redirect('/settings?calendar_error=db_error')
    }

    res.redirect('/settings?calendar_connected=true')
  } catch (error) {
    console.error('Calendar callback error:', error)
    res.redirect('/settings?calendar_error=unknown')
  }
}
