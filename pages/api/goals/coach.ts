import type { NextApiRequest, NextApiResponse } from 'next'

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

  const apiKey = process.env.AI_API_KEY || process.env.GITHUB_DEVELOPER_AI_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI API key not configured' })
  }

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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5.1-mini',
        temperature: 0.4,
        max_tokens: 260,
        messages: [
          {
            role: 'system',
            content:
              'You analyze personal goals and respond with JSON: momentumScore (0-100), summary (string), risks (array), nextSteps (array). Be concise and actionable.'
          },
          {
            role: 'user',
            content: `Goal: ${goal.title}\nStatus: ${goal.status}\nCategory: ${goal.category ?? 'n/a'}\nTarget: ${goal.target_date ?? 'n/a'}\nNote: ${goal.progress_note ?? 'n/a'}\nMilestones:\n${msSummary || 'none'}`
          }
        ]
      })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('goal coach error', text)
      return res.status(500).json({ error: 'Failed to evaluate goal' })
    }

    const json: any = await response.json()
    const output = json.choices?.[0]?.message?.content?.trim() ?? ''
    const cleaned = output.replace(/```json|```/g, '').trim()
    try {
      const parsed = JSON.parse(cleaned)
      return res.status(200).json({
        goalId: goal.id,
        momentumScore: Number(parsed.momentumScore ?? 0),
        summary: parsed.summary ?? 'No summary available',
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : []
      })
    } catch (error) {
      console.error('goal coach parse error', cleaned)
      return res.status(200).json({
        goalId: goal.id,
        momentumScore: 0,
        summary: 'Unable to parse AI response',
        risks: [],
        nextSteps: []
      })
    }
  } catch (error) {
    console.error('goal coach exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
