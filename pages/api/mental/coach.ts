import type { NextApiRequest, NextApiResponse } from 'next'

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

  const apiKey = process.env.AI_API_KEY || process.env.GITHUB_DEVELOPER_AI_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI API key not configured' })
  }

  const { logs } = req.body as { logs?: MoodPayload[] }
  if (!logs || !logs.length) {
    return res.status(400).json({ error: 'Mood logs required' })
  }

  const payload = logs
    .slice(-7)
    .map((log) => `${log.created_at.slice(0, 10)} | mood:${log.mood_label ?? 'na'}(${log.mood_score ?? 'na'}) | stress:${log.stress_score ?? 'na'} | note:${log.note ?? '—'}`)
    .join('\n')

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5.1-mini',
        temperature: 0.55,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content:
              'You are a compassionate mental health companion. Return JSON with encouragement, burnoutRisk (low|medium|high), actions (max 3), regulationTips (max 3). Keep tone practical.'
          },
          {
            role: 'user',
            content: `Recent entries (oldest to newest):\n${payload}`
          }
        ]
      })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('mental coach error', text)
      return res.status(500).json({ error: 'Failed to analyze mood logs' })
    }

    const json: any = await response.json()
    const output = json.choices?.[0]?.message?.content?.trim() ?? ''
    const cleaned = output.replace(/```json|```/g, '').trim()
    try {
      const parsed = JSON.parse(cleaned)
      return res.status(200).json({
        encouragement: parsed.encouragement ?? 'Keep showing up for yourself—small check-ins add up.',
        burnoutRisk: parsed.burnoutRisk ?? 'low',
        actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3) : [],
        regulationTips: Array.isArray(parsed.regulationTips) ? parsed.regulationTips.slice(0, 3) : []
      })
    } catch (error) {
      console.error('mental coach parse error', cleaned)
      return res.status(200).json({
        encouragement: 'Keep checking in with your emotions. Consistency builds resilience.',
        burnoutRisk: 'low',
        actions: [],
        regulationTips: []
      })
    }
  } catch (error) {
    console.error('mental coach exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
