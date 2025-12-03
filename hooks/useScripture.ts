import { useEffect, useState } from 'react'

interface Verse {
  reference: string
  text: string
}

export function useScripture() {
  const [verse, setVerse] = useState<Verse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRandom = async () => {
    setLoading(true)
    setError(null)
    try {
      // labs.bible.org provides a free random verse JSON endpoint
      const res = await fetch('https://labs.bible.org/api/?passage=random&type=json')
      if (!res.ok) throw new Error('Failed to fetch verse')
      const data = await res.json()
      const item = Array.isArray(data) ? data[0] : null
      const reference = item ? `${item.bookname} ${item.chapter}:${item.verse}` : '—'
      const text = item ? item.text : 'No verse available.'
      setVerse({ reference, text })
    } catch (e: any) {
      setError(e?.message || 'Error fetching verse')
      setVerse({ reference: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRandom() }, [])

  const refresh = () => fetchRandom()

  return { verse, loading, error, refresh }
}

export default useScripture