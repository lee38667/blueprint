import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { aiJSON, AI_MODELS } from '../../../lib/aiClient'

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

  const user = await authGuard(req, res, { name: 'notes-analyze', rateLimit: { limit: 30, windowMs: 60_000 } })
  if (!user) return

  const { content, tags = [] } = req.body as { content?: string; tags?: string[] }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Note content is required' })
  }

  try {
    const parsed = await aiJSON<{ summary?: string; mood?: string; sentiment?: string; keywords?: string[]; actionItems?: string[]; suggestedTags?: string[] }>({
      model: AI_MODELS.smart,
      temperature: 0.35,
      maxTokens: 500,
      system:
        'You examine a personal journal entry and return concise analytics as JSON only, shape: { "summary": string, "mood": string, "sentiment": string, "keywords": string[], "actionItems": string[], "suggestedTags": string[] }. Prefer reusing the existing tags where relevant. Keep summary to 1-2 sentences.',
      user: `Existing tags: ${tags.join(', ') || 'none'}\nEntry: ${content}`,
      fallback: { summary: 'Could not analyze this entry right now.', mood: 'unknown', sentiment: 'unknown', keywords: [], actionItems: [], suggestedTags: [] },
    })
    return res.status(200).json({
      summary: parsed.summary ?? 'No summary',
      mood: parsed.mood ?? 'neutral',
      sentiment: parsed.sentiment ?? 'balanced',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : []
    })
  } catch (error) {
    console.error('note analyze exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
