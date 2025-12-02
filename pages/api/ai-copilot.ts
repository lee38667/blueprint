import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type Data = { insight: string } | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Prefer AI_API_KEY; fall back to GITHUB_DEVELOPER_AI_KEY if provided
  const apiKey = process.env.AI_API_KEY || process.env.GITHUB_DEVELOPER_AI_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI API key not configured' })
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const { mood, mode = 'mood' } = req.body as { mood?: string; mode?: 'mood' | 'focus' }

  if (!mood && mode === 'mood') {
    return res.status(400).json({ error: 'Mood is required' })
  }

  try {
    let goalsSummary = ''
    let moodSummary = ''

    // For focus mode, pull recent goals + mood logs for additional context
    if (mode === 'focus' && supabaseUrl && supabaseServiceKey) {
      const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      })

      const { data: goals } = await supabaseServer
        .from('goals')
        .select('title, status, target_date')
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: moods } = await supabaseServer
        .from('mood_logs')
        .select('mood_label, mood_score, stress_score, created_at')
        .order('created_at', { ascending: false })
        .limit(7)

      if (goals && goals.length) {
        const parts = goals.map(g => {
          const status = g.status ?? 'active'
          const title = g.title ?? 'Untitled goal'
          const date = g.target_date ? ` (target ${g.target_date})` : ''
          return `- [${status}] ${title}${date}`
        })
        goalsSummary = `Current goals:\n${parts.join('\n')}`
      }

      if (moods && moods.length) {
        const parts = moods
          .slice()
          .reverse()
          .map(m => {
            const label = m.mood_label || 'n/a'
            const moodScore = m.mood_score ?? 'n/a'
            const stress = m.stress_score ?? 'n/a'
            const day = new Date(m.created_at).toISOString().slice(0, 10)
            return `${day}: mood ${moodScore}, stress ${stress}, label ${label}`
          })
        moodSummary = `Recent mood check-ins (oldest to newest):\n${parts.join('\n')}`
      }
    }

    const userPrompt =
      mode === 'focus'
        ? `The user reports feeling: ${mood ?? 'unspecified'}.\n\n${goalsSummary || 'No goals on record.'}\n\n${moodSummary || 'No recent mood logs.'}\n\nGiven this, suggest what they should focus on TODAY in 3–5 short bullet points. Be concrete, gentle, and realistic for a single day.`
        : `The user reports feeling: ${mood}. Respond with a brief, actionable insight and encouragement.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5.1-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a concise, encouraging personal coach helping someone plan their day. Keep answers short and specific.'
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 120,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('AI API error:', text)
      return res.status(500).json({ error: 'Failed to fetch AI insight' })
    }

    const json: any = await response.json()
    const insight = json.choices?.[0]?.message?.content?.trim() || 'No insight generated.'

    return res.status(200).json({ insight })
  } catch (error) {
    console.error('AI route error:', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}
