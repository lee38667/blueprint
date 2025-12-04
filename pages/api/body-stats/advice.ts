import type { NextApiRequest, NextApiResponse } from 'next'

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

  const apiKey = process.env.AI_API_KEY || process.env.GITHUB_DEVELOPER_AI_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI API key not configured' })
  }

  const { stats } = req.body as { stats?: BodyStatPayload[] }
  if (!stats || !stats.length) {
    return res.status(400).json({ error: 'Stats array required' })
  }

  const formatted = stats
    .slice(-7)
    .map((s) => `${s.recorded_at.slice(0, 10)} | weight:${s.weight ?? 'na'} | sleep:${s.sleep_hours ?? 'na'} | water:${s.water_ml ?? 'na'} | stress:${s.stress ?? 'na'}`)
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
        temperature: 0.45,
        max_tokens: 160,
        messages: [
          {
            role: 'system',
            content:
              'You are a wellness analyst. Provide concise advice from weekly biometric trends. Respond as JSON with keys headline (string) and insights (array of up to 4 bullet strings).'
          },
          {
            role: 'user',
            content: `Weekly stats (oldest -> newest):\n${formatted}`
          }
        ]
      })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('body stats advice error', text)
      return res.status(500).json({ error: 'Failed to analyze stats' })
    }

    const json: any = await response.json()
    const output = json.choices?.[0]?.message?.content?.trim() ?? ''
    const cleaned = output.replace(/```json|```/g, '').trim()
    try {
      const parsed = JSON.parse(cleaned)
      return res.status(200).json({
        headline: parsed.headline ?? 'Wellness snapshot',
        insights: parsed.insights ?? []
      })
    } catch (error) {
      console.error('body stats parse error', cleaned)
      return res.status(200).json({ headline: 'Unable to parse AI response', insights: [] })
    }
  } catch (error) {
    console.error('body stats advice exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
