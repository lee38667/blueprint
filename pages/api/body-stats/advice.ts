import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { aiJSON, AI_MODELS } from '../../../lib/aiClient'

interface BodyStatPayload {
  recorded_at: string
  weight?: number | null
  sleep_hours?: number | null
  water_ml?: number | null
  stress?: number | null
}

type Success = {
  insights: string[]
  headline: string
}

type ErrorPayload = { error: string }

type Data = Success | ErrorPayload

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, { name: 'body-stats-advice', rateLimit: { limit: 30, windowMs: 60_000 } })
  if (!user) return

  const { stats } = req.body as { stats?: BodyStatPayload[] }
  if (!stats || !stats.length) {
    return res.status(400).json({ error: 'Stats array required' })
  }

  const formatted = stats
    .slice(-7)
    .map((s) => `${s.recorded_at.slice(0, 10)} | weight:${s.weight ?? 'na'} | sleep:${s.sleep_hours ?? 'na'} | water:${s.water_ml ?? 'na'} | stress:${s.stress ?? 'na'}`)
    .join('\n')

  try {
    const parsed = await aiJSON<{ headline?: string; insights?: string[] }>({
      model: AI_MODELS.smart,
      temperature: 0.4,
      maxTokens: 400,
      system:
        'You are a wellness analyst. Respond as JSON only, shape: { "headline": string, "insights": string[] (up to 4 short bullets) }. Base advice strictly on the weekly weight/sleep/water/stress trends provided; call out notable changes and one realistic next step.',
      user: `Weekly stats (oldest -> newest):\n${formatted}`,
      fallback: { headline: 'Unable to analyze stats right now.', insights: [] },
    })
    return res.status(200).json({
      headline: parsed.headline ?? 'Wellness snapshot',
      insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 4) : []
    })
  } catch (error) {
    console.error('body stats advice exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
