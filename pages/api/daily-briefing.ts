import type { NextApiRequest, NextApiResponse } from 'next'
import { formatSnapshotForAI, AISnapshot } from '../../lib/aiSnapshot'
import { authGuard } from '../../lib/apiAuth'
import { aiJSON, AI_MODELS } from '../../lib/aiClient'

type Success = {
  greeting: string
  priorityTasks: Array<{ title: string; priority: string; dueInfo?: string }>
  overdueAlerts: string[]
  moodTrend: string
  financialNote: string
  focusRecommendation: string
  generatedAt: string
}

type ErrorPayload = { error: string }
type Data = Success | ErrorPayload

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, { name: 'daily-briefing', rateLimit: { limit: 15, windowMs: 60_000 } })
  if (!user) return

  const { snapshot } = req.body as { snapshot?: AISnapshot }
  if (!snapshot) {
    return res.status(400).json({ error: 'Snapshot payload required' })
  }

  const formatted = formatSnapshotForAI(snapshot)
  const now = new Date()
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  try {
    const parsed = await aiJSON<{
      greeting?: string
      priorityTasks?: Array<{ title: string; priority: string; dueInfo?: string }>
      overdueAlerts?: string[]
      moodTrend?: string
      financialNote?: string
      focusRecommendation?: string
    }>({
      model: AI_MODELS.smart,
      temperature: 0.35,
      maxTokens: 700,
      system: `You generate a morning briefing for a personal life-management system. Today is ${dayOfWeek}, ${dateStr}. Return JSON only, shape:
{
  "greeting": string (short, warm, personalized),
  "priorityTasks": [{ "title": string, "priority": string, "dueInfo"?: string }] (top 3 for today),
  "overdueAlerts": string[] (overdue items / urgent warnings),
  "moodTrend": string (one sentence on recent mood/wellness),
  "financialNote": string (one sentence on financial status),
  "focusRecommendation": string (one actionable focus for today)
}
Ground every field in the supplied data; if a domain has no data, say so plainly. Be concise and actionable.`,
      user: formatted,
      fallback: {
        greeting: `Good morning! It's ${dayOfWeek}.`,
        priorityTasks: [],
        overdueAlerts: [],
        moodTrend: 'Unable to analyze mood data.',
        financialNote: 'Unable to analyze financial data.',
        focusRecommendation: 'Focus on your highest priority task today.',
      },
    })
    return res.status(200).json({
      greeting: parsed.greeting ?? `Good morning! It's ${dayOfWeek}.`,
      priorityTasks: Array.isArray(parsed.priorityTasks) ? parsed.priorityTasks : [],
      overdueAlerts: Array.isArray(parsed.overdueAlerts) ? parsed.overdueAlerts : [],
      moodTrend: parsed.moodTrend ?? 'No mood data available yet.',
      financialNote: parsed.financialNote ?? 'No financial data available yet.',
      focusRecommendation: parsed.focusRecommendation ?? 'Start with your most important task today.',
      generatedAt: now.toISOString()
    })
  } catch (error) {
    console.error('daily briefing exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
