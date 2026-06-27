import type { NextApiRequest, NextApiResponse } from 'next'
import { getServiceClient } from '../../../lib/apiAuth'
import { signState } from '../../../lib/oauthState'
import { fitOAuthClient, FIT_SCOPES } from '../../../lib/serverFitness'

const supabase = getServiceClient()

/** Initiates the Google Fit OAuth flow (separate consent/scopes from Calendar). */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Not authenticated. Please log in first.' })

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Not authenticated. Please log in first.' })

    const authUrl = fitOAuthClient().generateAuthUrl({
      access_type: 'offline',
      scope: FIT_SCOPES,
      prompt: 'consent',
      state: signState(user.id),
    })

    res.redirect(authUrl)
  } catch (err) {
    console.error('Fitness auth error:', err)
    res.status(500).json({ error: 'Failed to initiate Google Fit authentication' })
  }
}
