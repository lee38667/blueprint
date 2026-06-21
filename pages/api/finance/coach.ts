import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard } from '../../../lib/apiAuth'
import { aiJSON, AI_MODELS } from '../../../lib/aiClient'

type SummaryPayload = {
  balance?: number | null
  savings?: number | null
  debt?: number | null
}

type HistoryPayload = {
  recorded_at: string
  balance: number
  delta?: number | null
}

type LogPayload = {
  recorded_at: string
  type: 'income' | 'expense'
  amount: number
  category?: string | null
}

type Success = {
  outlook: string
  guardrails: string[]
  opportunities: string[]
  cashflowScore: number
}

type ErrorPayload = { error: string }

type Data = Success | ErrorPayload

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, { name: 'finance-coach', rateLimit: { limit: 30, windowMs: 60_000 } })
  if (!user) return

  const { summary, history = [], logs = [] } = req.body as {
    summary?: SummaryPayload | null
    history?: HistoryPayload[]
    logs?: LogPayload[]
  }

  if ((!history || history.length === 0) && (!logs || logs.length === 0)) {
    return res.status(400).json({ error: 'Financial history or logs required' })
  }

  const trendBlock = history
    .map((entry) => `${entry.recorded_at.slice(0, 10)} balance:${entry.balance} delta:${entry.delta ?? 'na'}`)
    .join('\n')
  const logBlock = logs
    .map((entry) => `${entry.recorded_at.slice(0, 10)} ${entry.type} $${entry.amount} category:${entry.category ?? 'na'}`)
    .join('\n')

  try {
    const parsed = await aiJSON<{ outlook?: string; guardrails?: string[]; opportunities?: string[]; cashflowScore?: number }>({
      model: AI_MODELS.smart,
      temperature: 0.3,
      maxTokens: 450,
      system:
        'You are a concise personal financial planning assistant. Respond as JSON only, shape: { "outlook": string, "guardrails": string[] (3 short cautions), "opportunities": string[] (3 short ideas), "cashflowScore": 0-100 integer }. Ground every statement in the supplied balance, history, and logs — do not invent numbers.',
      user: `Balance snapshot: ${summary?.balance ?? 'n/a'} savings:${summary?.savings ?? 'n/a'} debt:${summary?.debt ?? 'n/a'}\nRecent balance history:\n${trendBlock || 'none'}\nIncome/expense logs:\n${logBlock || 'none'}`,
      fallback: { outlook: 'Unable to analyze finances right now.', guardrails: [], opportunities: [], cashflowScore: 50 },
    })
    return res.status(200).json({
      outlook: parsed.outlook ?? 'Cashflow steady. Continue tracking habits.',
      guardrails: Array.isArray(parsed.guardrails) ? parsed.guardrails.slice(0, 3) : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.slice(0, 3) : [],
      cashflowScore: Number(parsed.cashflowScore ?? 50)
    })
  } catch (error) {
    console.error('finance coach exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
