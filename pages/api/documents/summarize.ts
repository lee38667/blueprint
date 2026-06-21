import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { aiJSON, AI_MODELS } from '../../../lib/aiClient'

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

  const user = await authGuard(req, res, { name: 'documents-summarize', rateLimit: { limit: 20, windowMs: 60_000 } })
  if (!user) return

  const { title, snippet = '', context = '' } = req.body as { title?: string; snippet?: string; context?: string }
  if (!title && !snippet && !context) {
    return res.status(400).json({ error: 'Document details missing' })
  }

  try {
    const parsed = await aiJSON<{ summary?: string; talkingPoints?: string[]; keywords?: string[] }>({
      model: AI_MODELS.smart,
      temperature: 0.3,
      maxTokens: 450,
      system:
        'Summarize personal documents succinctly. Respond as JSON only, shape: { "summary": string, "talkingPoints": string[] (2-4 short phrases), "keywords": string[] }. Base everything on the supplied title/context/snippet only.',
      user: `Title: ${title ?? 'Untitled'}\nContext: ${context || 'n/a'}\nSnippet: ${snippet.slice(0, 1800)}`,
      fallback: { summary: 'Unable to summarize this document right now.', talkingPoints: [], keywords: [] },
    })
    return res.status(200).json({
      summary: parsed.summary ?? 'No summary available',
      talkingPoints: Array.isArray(parsed.talkingPoints) ? parsed.talkingPoints : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
    })
  } catch (error) {
    console.error('doc summarize exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
