import { useEffect, useState } from 'react'

interface Quote {
  text: string
  author: string
}

export function useQuotes() {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRandom = async () => {
    setLoading(true)
    setError(null)
    try {
      // ZenQuotes.io free API for random quotes
      const res = await fetch('https://zenquotes.io/api/random')
      if (!res.ok) throw new Error('Failed to fetch quote')
      const data = await res.json()
      const item = Array.isArray(data) ? data[0] : null
      const text = item ? item.q : 'Stay positive.'
      const author = item ? item.a : 'Unknown'
      setQuote({ text, author })
    } catch (e: any) {
      setError(e?.message || 'Error fetching quote')
      setQuote({ text: 'The only way out is through.', author: 'Robert Frost' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRandom() }, [])

  const refresh = () => fetchRandom()

  return { quote, loading, error, refresh }
}

export default useQuotes