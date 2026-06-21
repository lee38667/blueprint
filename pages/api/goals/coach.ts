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

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  let daysToTarget: number | null = null
  if (goal.target_date) {
    const t = new Date(goal.target_date).getTime()
    if (!Number.isNaN(t)) daysToTarget = Math.round((t - now.getTime()) / 86_400_000)
  }
  const timeContext =
    daysToTarget === null
      ? 'No target date set.'
      : daysToTarget < 0
        ? `Target date passed ${Math.abs(daysToTarget)} days ago.`
        : `${daysToTarget} days remain until the target date.`

  try {
    const parsed = await aiJSON<{ momentumScore?: number; summary?: string; risks?: string[]; nextSteps?: string[] }>({
      model: AI_MODELS.smart,
      temperature: 0.3,
      maxTokens: 500,
      system:
        'You analyze personal goals and respond with JSON only, shape: { "momentumScore": 0-100 integer, "summary": string, "risks": string[], "nextSteps": string[] }. You are time-aware: weigh the days remaining until the target date heavily — an overdue or near-deadline goal with little progress is high risk and low momentum. momentumScore reflects realistic progress likelihood given status, time remaining, and milestone completion. Keep summary to 1-2 sentences; risks and nextSteps to short, concrete, actionable items anchored to the remaining time.',
      user: `Today: ${today}\nGoal: ${goal.title}\nStatus: ${goal.status}\nCategory: ${goal.category ?? 'n/a'}\nTarget: ${goal.target_date ?? 'n/a'} (${timeContext})\nNote: ${goal.progress_note ?? 'n/a'}\nMilestones:\n${msSummary || 'none'}`,
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
