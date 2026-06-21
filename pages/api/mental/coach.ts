import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { aiJSON, AI_MODELS } from '../../../lib/aiClient'

type MoodPayload = {
  created_at: string
  mood_label?: string | null
  mood_score?: number | null
  stress_score?: number | null
  note?: string | null
}

type Success = {
  encouragement: string
  burnoutRisk: 'low' | 'medium' | 'high'
  actions: string[]
  regulationTips: string[]
}

type ErrorPayload = { error: string }

type Data = Success | ErrorPayload

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, { name: 'mental-coach', rateLimit: { limit: 30, windowMs: 60_000 } })
  if (!user) return

  const { logs } = req.body as { logs?: MoodPayload[] }
  if (!logs || !logs.length) {
    return res.status(400).json({ error: 'Mood logs required' })
  }

  const payload = logs
    .slice(-7)
    .map((log) => `${log.created_at.slice(0, 10)} | mood:${log.mood_label ?? 'na'}(${log.mood_score ?? 'na'}) | stress:${log.stress_score ?? 'na'} | note:${log.note ?? '—'}`)
    .join('\n')

  try {
    const parsed = await aiJSON<{ encouragement?: string; burnoutRisk?: 'low' | 'medium' | 'high'; actions?: string[]; regulationTips?: string[] }>({
      model: AI_MODELS.smart,
      temperature: 0.5,
      maxTokens: 450,
      system:
        'You are a compassionate, practical mental-health companion. Respond as JSON only, shape: { "encouragement": string, "burnoutRisk": "low"|"medium"|"high", "actions": string[] (max 3), "regulationTips": string[] (max 3) }. Infer burnoutRisk from mood/stress trends in the data. Be warm but concrete; never diagnose.',
      user: `Recent entries (oldest to newest):\n${payload}`,
      fallback: { encouragement: 'Keep checking in with your emotions. Consistency builds resilience.', burnoutRisk: 'low', actions: [], regulationTips: [] },
    })
    return res.status(200).json({
      encouragement: parsed.encouragement ?? 'Keep showing up for yourself—small check-ins add up.',
      burnoutRisk: parsed.burnoutRisk ?? 'low',
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3) : [],
      regulationTips: Array.isArray(parsed.regulationTips) ? parsed.regulationTips.slice(0, 3) : []
    })
  } catch (error) {
    console.error('mental coach exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
