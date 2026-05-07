import type { NextApiRequest, NextApiResponse } from 'next'

type Quote = {
  q: string
  a: string
  h: string
}

const FALLBACK_QUOTES: Quote[] = [
  { q: "The only way to do great work is to love what you do.", a: "Steve Jobs", h: "" },
  { q: "It does not matter how slowly you go as long as you do not stop.", a: "Confucius", h: "" },
  { q: "Believe you can and you're halfway there.", a: "Theodore Roosevelt", h: "" },
  { q: "What you get by achieving your goals is not as important as what you become by achieving your goals.", a: "Zig Ziglar", h: "" },
  { q: "Success is not final, failure is not fatal: it is the courage to continue that counts.", a: "Winston Churchill", h: "" },
  { q: "The future belongs to those who believe in the beauty of their dreams.", a: "Eleanor Roosevelt", h: "" },
  { q: "You are never too old to set another goal or to dream a new dream.", a: "C.S. Lewis", h: "" },
  { q: "Discipline is the bridge between goals and accomplishment.", a: "Jim Rohn", h: "" },
  { q: "The secret of getting ahead is getting started.", a: "Mark Twain", h: "" },
  { q: "Small daily improvements over time lead to stunning results.", a: "Robin Sharma", h: "" },
]

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)
      if (response.ok) return response
    } catch {
      if (i === retries) throw new Error('All retries failed')
    }
  }
  throw new Error('All retries failed')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Quote[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await fetchWithRetry('https://zenquotes.io/api/random')
    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Quote fetch error, using fallback:', error)
    // Return a random fallback quote instead of an error
    const randomQuote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
    return res.status(200).json([randomQuote])
  }
}
