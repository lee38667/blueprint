import type { NextApiRequest, NextApiResponse } from 'next'

type Success = {
  summary: string
  mood: string
  sentiment: string
  keywords: string[]
  actionItems: string[]
  suggestedTags: string[]
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

  const { content, tags = [] } = req.body as { content?: string; tags?: string[] }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Note content is required' })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5.1-mini',
        temperature: 0.4,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content:
              'You examine personal journal entries and return concise analytics. Respond strictly as compact JSON with keys summary, mood, sentiment, keywords, actionItems, suggestedTags.'
          },
          {
            role: 'user',
            content: `Existing tags: ${tags.join(', ') || 'none'}\nEntry: ${content}`
          }
        ]
      })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('note analyze error', text)
      return res.status(500).json({ error: 'Failed to analyze note' })
    }

    const json: any = await response.json()
    const output = json.choices?.[0]?.message?.content?.trim() ?? ''
    const cleaned = output.replace(/```json|```/g, '').trim()
    try {
      const parsed = JSON.parse(cleaned)
      return res.status(200).json({
        summary: parsed.summary ?? 'No summary',
        mood: parsed.mood ?? 'neutral',
        sentiment: parsed.sentiment ?? 'balanced',
        keywords: parsed.keywords ?? [],
        actionItems: parsed.actionItems ?? [],
        suggestedTags: parsed.suggestedTags ?? []
      })
    } catch (error) {
      console.error('note analyze parse error', cleaned)
      return res.status(200).json({
        summary: 'Could not parse AI response',
        mood: 'unknown',
        sentiment: 'unknown',
        keywords: [],
        actionItems: [],
        suggestedTags: []
      })
    }
  } catch (error) {
    console.error('note analyze exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
