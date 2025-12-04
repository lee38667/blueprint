import type { NextApiRequest, NextApiResponse } from 'next'

type Success = {
  summary: string
  talkingPoints: string[]
  keywords: string[]
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

  const { title, snippet = '', context = '' } = req.body as { title?: string; snippet?: string; context?: string }
  if (!title && !snippet && !context) {
    return res.status(400).json({ error: 'Document details missing' })
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
        temperature: 0.35,
        max_tokens: 180,
        messages: [
          {
            role: 'system',
            content:
              'Summarize personal documents succinctly. Respond as JSON with keys summary, talkingPoints, keywords. Talking points should be 2-4 short bullet phrases.'
          },
          {
            role: 'user',
            content: `Title: ${title ?? 'Untitled'}\nContext: ${context || 'n/a'}\nSnippet: ${snippet.slice(0, 1800)}`
          }
        ]
      })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('doc summarize error', text)
      return res.status(500).json({ error: 'Failed to summarize document' })
    }

    const json: any = await response.json()
    const output = json.choices?.[0]?.message?.content?.trim() ?? ''
    const cleaned = output.replace(/```json|```/g, '').trim()
    try {
      const parsed = JSON.parse(cleaned)
      return res.status(200).json({
        summary: parsed.summary ?? 'No summary available',
        talkingPoints: parsed.talkingPoints ?? [],
        keywords: parsed.keywords ?? []
      })
    } catch (error) {
      console.error('doc summarize parse error', cleaned)
      return res.status(200).json({ summary: 'Unable to parse AI response', talkingPoints: [], keywords: [] })
    }
  } catch (error) {
    console.error('doc summarize exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
