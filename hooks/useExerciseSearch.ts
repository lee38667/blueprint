import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface ExerciseSuggestion {
  id: number
  name: string
  category: string | null
  image: string | null
}

/**
 * Debounced exercise-name autocomplete backed by the wger catalog
 * (/api/exercises/search). Returns suggestions for the given term.
 */
export function useExerciseSearch(term: string, delayMs = 300) {
  const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const cache = useRef(new Map<string, ExerciseSuggestion[]>())

  useEffect(() => {
    const q = term.trim().toLowerCase()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    if (cache.current.has(q)) {
      setSuggestions(cache.current.get(q)!)
      return
    }

    let cancelled = false
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const list = (data.exercises ?? []) as ExerciseSuggestion[]
        cache.current.set(q, list)
        setSuggestions(list)
      } catch {
        // Autocomplete is best-effort; silent on failure.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, delayMs)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [term, delayMs])

  return { suggestions, loading }
}

export default useExerciseSearch
