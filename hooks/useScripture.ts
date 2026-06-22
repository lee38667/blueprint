import { useCallback, useEffect, useState } from 'react'

export interface DailyVerse {
  reference: string
  text: string
  theme: string
  themeKey: string
  encouragement: string
  translation: string
}

const FALLBACK: DailyVerse = {
  reference: 'Lamentations 3:22-23',
  text: 'The LORD’s loving kindnesses do not cease; his mercies are new every morning. Great is your faithfulness.',
  theme: 'Hope',
  themeKey: 'hope',
  encouragement: 'The story isn’t over — hold on to what is ahead.',
  translation: 'World English Bible',
}

export function useScripture() {
  const [verse, setVerse] = useState<DailyVerse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)

  const load = useCallback(async (nextOffset: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/scripture/daily?offset=${nextOffset}`)
      if (!res.ok) throw new Error('Failed to fetch verse')
      const data = (await res.json()) as DailyVerse
      setVerse(data)
    } catch (e: any) {
      setError(e?.message || 'Error fetching verse')
      setVerse(FALLBACK)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(0)
  }, [load])

  // "Refresh" advances the rotation to the next themed verse.
  const refresh = useCallback(() => {
    const next = offset + 1
    setOffset(next)
    load(next)
  }, [offset, load])

  return { verse, loading, error, refresh }
}

export default useScripture
