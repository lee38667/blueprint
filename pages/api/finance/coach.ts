import type { NextApiRequest, NextApiResponse } from 'next'

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

  const apiKey = process.env.AI_API_KEY || process.env.GITHUB_DEVELOPER_AI_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI API key not configured' })
  }

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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5.1-mini',
        temperature: 0.35,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content:
              'You are a concise financial planning assistant. Respond as JSON with outlook (string), guardrails (array of 3 short cautions), opportunities (array of 3), cashflowScore (0-100).'
          },
          {
            role: 'user',
            content: `Balance snapshot: ${summary?.balance ?? 'n/a'} savings:${summary?.savings ?? 'n/a'} debt:${summary?.debt ?? 'n/a'}\nRecent balance history:\n${trendBlock || 'none'}\nIncome/expense logs:\n${logBlock || 'none'}`
          }
        ]
      })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('finance coach error', text)
      return res.status(500).json({ error: 'Failed to analyze finances' })
    }

    const json: any = await response.json()
    const output = json.choices?.[0]?.message?.content?.trim() ?? ''
    const cleaned = output.replace(/```json|```/g, '').trim()
    try {
      const parsed = JSON.parse(cleaned)
      return res.status(200).json({
        outlook: parsed.outlook ?? 'Cashflow steady. Continue tracking habits.',
        guardrails: Array.isArray(parsed.guardrails) ? parsed.guardrails.slice(0, 3) : [],
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.slice(0, 3) : [],
        cashflowScore: Number(parsed.cashflowScore ?? 50)
      })
    } catch (error) {
      console.error('finance coach parse error', cleaned)
      return res.status(200).json({ outlook: 'Unable to parse AI response', guardrails: [], opportunities: [], cashflowScore: 0 })
    }
  } catch (error) {
    console.error('finance coach exception', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
