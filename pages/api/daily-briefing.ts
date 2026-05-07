import type { NextApiRequest, NextApiResponse } from 'next'
import { formatSnapshotForAI, AISnapshot } from '../../lib/aiSnapshot'

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

  const apiKey = process.env.AI_API_KEY || process.env.GITHUB_DEVELOPER_AI_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI API key not configured' })
  }

  const { snapshot } = req.body as { snapshot?: AISnapshot }
  if (!snapshot) {
    return res.status(400).json({ error: 'Snapshot payload required' })
  }

  const formatted = formatSnapshotForAI(snapshot)
  const now = new Date()
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

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
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content: `You generate a morning briefing for a personal life-management system. Today is ${dayOfWeek}, ${dateStr}. Return JSON with keys:
- greeting (string, short personalized greeting)
- priorityTasks (array of {title, priority, dueInfo?} — top 3 most important tasks for today)
- overdueAlerts (array of strings — any overdue items or urgent warnings)
- moodTrend (string — one sentence about recent mood/wellness pattern)
- financialNote (string — one sentence about financial status)
- focusRecommendation (string — one actionable focus recommendation for today)
Be concise, warm, and actionable.`
          },
          {
            role: 'user',
            content: formatted
          }
        ]
      })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('daily briefing error', text)
      return res.status(500).json({ error: 'Failed to generate briefing' })
    }

    const json: any = await response.json()
    const output = json.choices?.[0]?.message?.content?.trim() ?? ''
    const cleaned = output.replace(/```json|```/g, '').trim()

    try {
      const parsed = JSON.parse(cleaned)
      return res.status(200).json({
        greeting: parsed.greeting ?? `Good morning! It's ${dayOfWeek}.`,
        priorityTasks: Array.isArray(parsed.priorityTasks) ? parsed.priorityTasks : [],
        overdueAlerts: Array.isArray(parsed.overdueAlerts) ? parsed.overdueAlerts : [],
        moodTrend: parsed.moodTrend ?? 'No mood data available yet.',
        financialNote: parsed.financialNote ?? 'No financial data available yet.',
        focusRecommendation: parsed.focusRecommendation ?? 'Start with your most important task today.',
        generatedAt: now.toISOString()
      })
    } catch {
      console.error('daily briefing parse error', cleaned)
      return res.status(200).json({
        greeting: `Good morning! It's ${dayOfWeek}.`,
        priorityTasks: [],
        overdueAlerts: [],
        moodTrend: 'Unable to analyze mood data.',
        financialNote: 'Unable to analyze financial data.',
        focusRecommendation: 'Focus on your highest priority task today.',
        generatedAt: now.toISOString()
      })
    }
  } catch (error) {
    console.error('daily briefing exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
