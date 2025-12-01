import type { NextApiRequest, NextApiResponse } from 'next'

type Data = { insight: string } | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.AI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI API key not configured' })
  }

  const { mood } = req.body as { mood?: string }

  if (!mood) {
    return res.status(400).json({ error: 'Mood is required' })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5 mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a concise, encouraging personal coach. One short paragraph maximum.'
          },
          {
            role: 'user',
            content: `The user reports feeling: ${mood}. Respond with a brief, actionable insight and encouragement.`
          }
        ],
        max_tokens: 120,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('AI API error:', text)
      return res.status(500).json({ error: 'Failed to fetch AI insight' })
    }

    const json: any = await response.json()
    const insight = json.choices?.[0]?.message?.content?.trim() || 'No insight generated.'

    return res.status(200).json({ insight })
  } catch (error) {
    console.error('AI route error:', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
