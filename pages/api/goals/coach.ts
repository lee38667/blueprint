import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { aiJSON, AI_MODELS } from '../../../lib/aiClient'

interface GoalPayload {
  id: string
  title: string
  status: string
  category?: string | null
  target_date?: string | null
  progress_note?: string | null
}

interface MilestonePayload {
  id: string
  goal_id: string
  title: string
  status: string
  due_date?: string | null
}

interface SubtaskPayload {
  id: string
  milestone_id: string
  title: string
  status: string
}

type Success = {
  goalId: string
  momentumScore: number
  summary: string
  risks: string[]
  nextSteps: string[]
}

type ErrorPayload = { error: string }

type Data = Success | ErrorPayload

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, { name: 'goals-coach', rateLimit: { limit: 30, windowMs: 60_000 } })
  if (!user) return

  const { goal, milestones = [], subtasks = [] } = req.body as {
    goal?: GoalPayload
    milestones?: MilestonePayload[]
    subtasks?: SubtaskPayload[]
  }

  if (!goal) {
    return res.status(400).json({ error: 'Goal payload required' })
  }

  const msSummary = milestones
    .map((m) => `${m.title} [${m.status}] due:${m.due_date ?? 'na'} | subtasks:${subtasks.filter((s) => s.milestone_id === m.id).length}`)
    .join('\n')

  try {
    const parsed = await aiJSON<{ momentumScore?: number; summary?: string; risks?: string[]; nextSteps?: string[] }>({
      model: AI_MODELS.smart,
      temperature: 0.3,
      maxTokens: 500,
      system:
        'You analyze personal goals and respond with JSON only, shape: { "momentumScore": 0-100 integer, "summary": string, "risks": string[], "nextSteps": string[] }. momentumScore reflects realistic progress likelihood given status, target date, and milestone completion. Keep summary to 1-2 sentences; risks and nextSteps to short, concrete, actionable items.',
      user: `Goal: ${goal.title}\nStatus: ${goal.status}\nCategory: ${goal.category ?? 'n/a'}\nTarget: ${goal.target_date ?? 'n/a'}\nNote: ${goal.progress_note ?? 'n/a'}\nMilestones:\n${msSummary || 'none'}`,
      fallback: { momentumScore: 0, summary: 'Unable to generate a summary right now.', risks: [], nextSteps: [] },
    })
    return res.status(200).json({
      goalId: goal.id,
      momentumScore: Number(parsed.momentumScore ?? 0),
      summary: parsed.summary ?? 'No summary available',
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : []
    })
  } catch (error) {
    console.error('goal coach exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
