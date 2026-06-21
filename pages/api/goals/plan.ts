import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { aiJSON, AI_MODELS } from '../../../lib/aiClient'

/**
 * AI goal planner — the AI is the one "in charge" of setting goals.
 *
 * It is explicitly time/date aware: the current date is injected so every
 * proposed target_date / milestone due_date is in the future and on a sensible
 * horizon. If the AI judges that no new goal should be set (e.g. the user is
 * already over-committed, or existing goals cover the intent), it returns
 * `mode: "recommendations"` with concrete suggestions instead of inventing goals.
 */

interface ExistingGoal {
  title: string
  status: string
  category?: string | null
  target_date?: string | null
}

interface ProposedMilestone {
  title: string
  due_date: string | null
}

interface ProposedGoal {
  title: string
  category: string | null
  target_date: string | null
  rationale: string
  milestones: ProposedMilestone[]
}

type Success = {
  mode: 'goals' | 'recommendations'
  summary: string
  goals: ProposedGoal[]
  recommendations: string[]
  today: string
}

type ErrorPayload = { error: string }

const isFutureISO = (d: string | null | undefined, todayMs: number): d is string => {
  if (!d) return false
  const t = new Date(d).getTime()
  return !Number.isNaN(t) && t >= todayMs - 86_400_000
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Success | ErrorPayload>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, { name: 'goals-plan', rateLimit: { limit: 15, windowMs: 60_000 } })
  if (!user) return

  const { intent = '', existingGoals = [], context = '' } = req.body as {
    intent?: string
    existingGoals?: ExistingGoal[]
    context?: string
  }

  const now = new Date()
  const todayMs = now.getTime()
  const today = now.toISOString().slice(0, 10)
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' })
  // Helpful explicit horizons so the model anchors dates correctly.
  const horizon = (days: number) => new Date(todayMs + days * 86_400_000).toISOString().slice(0, 10)

  const goalText = existingGoals.length
    ? existingGoals
        .map((g) => `- ${g.title} [${g.status}]${g.category ? ` (${g.category})` : ''}${g.target_date ? ` target ${g.target_date}` : ''}`)
        .join('\n')
    : 'None yet.'

  try {
    const parsed = await aiJSON<Partial<Success>>({
      model: AI_MODELS.smart,
      temperature: 0.4,
      maxTokens: 900,
      system: [
        'You are the goal-setting engine for a personal life-management app. You decide whether to set new goals or instead recommend improvements to what already exists.',
        'You are time and date aware. Use the provided current date to make every date sensible: target_date and milestone due_date MUST be in the future relative to today, on a realistic horizon (short goals ~2-6 weeks, medium ~2-4 months, large ~6-12 months). Never output a past date. Use YYYY-MM-DD format.',
        'Decide the mode:',
        '- "goals": propose 1-3 well-formed SMART goals when the user wants new direction or has clear gaps. Each goal needs a concrete title, a category, a realistic target_date, a one-sentence rationale, and 2-4 milestones each with a due_date that falls before the goal target_date.',
        '- "recommendations": if the user already has enough active goals, seems over-committed, or the intent is vague, do NOT invent goals. Return an empty goals array and give 3-5 specific recommendations to refocus, sequence, or refine existing goals instead.',
        'Respond as JSON only with shape: { "mode": "goals" | "recommendations", "summary": string, "goals": [{ "title": string, "category": string, "target_date": "YYYY-MM-DD", "rationale": string, "milestones": [{ "title": string, "due_date": "YYYY-MM-DD" }] }], "recommendations": string[] }.',
      ].join('\n'),
      user: [
        `Current date: ${today} (${weekday}).`,
        `Date anchors you may use: in 2 weeks = ${horizon(14)}, in 1 month = ${horizon(30)}, in 3 months = ${horizon(90)}, in 6 months = ${horizon(180)}, in 1 year = ${horizon(365)}.`,
        `User intent / focus: ${intent || '(none given — infer sensible goals or recommend refinements)'}`,
        `Extra context: ${context || 'n/a'}`,
        `Existing goals:\n${goalText}`,
      ].join('\n\n'),
      fallback: { mode: 'recommendations', summary: 'Unable to plan goals right now.', goals: [], recommendations: [] },
    })

    // Server-side guard: drop any non-future dates the model may still emit.
    const goals: ProposedGoal[] = Array.isArray(parsed.goals)
      ? parsed.goals.slice(0, 3).map((g) => ({
          title: String(g?.title ?? '').slice(0, 200),
          category: g?.category ? String(g.category).slice(0, 60) : null,
          target_date: isFutureISO(g?.target_date, todayMs) ? g!.target_date! : null,
          rationale: String(g?.rationale ?? '').slice(0, 300),
          milestones: Array.isArray(g?.milestones)
            ? g!.milestones!.slice(0, 4).map((m) => ({
                title: String(m?.title ?? '').slice(0, 200),
                due_date: isFutureISO(m?.due_date, todayMs) ? m!.due_date! : null,
              }))
            : [],
        })).filter((g) => g.title)
      : []

    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.map((r) => String(r)).filter(Boolean).slice(0, 6)
      : []

    const mode: 'goals' | 'recommendations' = parsed.mode === 'goals' && goals.length > 0 ? 'goals' : 'recommendations'

    return res.status(200).json({
      mode,
      summary: String(parsed.summary ?? (mode === 'goals' ? 'Proposed goals based on your context.' : 'Recommendations to refine your current goals.')),
      goals,
      recommendations,
      today,
    })
  } catch (error) {
    console.error('goal plan exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
