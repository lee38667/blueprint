import type { NextApiRequest, NextApiResponse } from 'next'
import { getServiceClient } from '../../../lib/apiAuth'
import { encryptToken } from '../../../lib/serverCrypto'
import { verifyState } from '../../../lib/oauthState'
import { fitOAuthClient } from '../../../lib/serverFitness'

const supabase = getServiceClient()

/** Handles the Google Fit OAuth callback: verifies state, stores encrypted tokens. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { code, state } = req.query
  if (!code || typeof code !== 'string') return res.redirect('/settings?fitness_error=no_code')

  try {
    const { tokens } = await fitOAuthClient().getToken(code)
    if (!tokens.access_token) return res.redirect('/settings?fitness_error=no_token')

    const userId = typeof state === 'string' ? verifyState(state) : null
    if (!userId) return res.redirect('/settings?fitness_error=invalid_state')

    const { error } = await supabase.from('fitness_connections').upsert(
      {
        user_id: userId,
        provider: 'google_fit',
        access_token: encryptToken(tokens.access_token),
        refresh_token: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' }
    )

    if (error) {
      console.error('Fitness callback db error:', error)
      return res.redirect('/settings?fitness_error=db_error')
    }

    res.redirect('/settings?fitness_connected=true')
  } catch (err) {
    console.error('Fitness callback error:', err)
    res.redirect('/settings?fitness_error=unknown')
  }
}
