/**
 * Wger — free, key-less open exercise database (https://wger.de/api/v2/).
 * Used to power exercise-name autocomplete in the gym logger and to map names
 * to the muscles they train.
 */

const BASE = 'https://wger.de/api/v2'
const ENGLISH = 2 // wger language id for English

export interface WgerExercise {
  id: number
  name: string
  category: string | null
  image: string | null
}

/** Searches the wger exercise catalog by term. Returns [] on any failure. */
export async function searchExercises(term: string, limit = 8): Promise<WgerExercise[]> {
  const q = term.trim()
  if (q.length < 2) return []

  try {
    const url = `${BASE}/exercise/search/?term=${encodeURIComponent(q)}&language=${ENGLISH}&format=json`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      // Wger is read-only public data; cache at the edge for a day.
      next: { revalidate: 86400 },
    } as RequestInit)
    if (!res.ok) return []

    const json = (await res.json()) as {
      suggestions?: Array<{ value: string; data?: { base_id?: number; id?: number; category?: string; image?: string | null } }>
    }

    const seen = new Set<string>()
    const out: WgerExercise[] = []
    for (const s of json.suggestions ?? []) {
      const name = s.value?.trim()
      if (!name) continue
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        id: s.data?.base_id ?? s.data?.id ?? out.length,
        name,
        category: s.data?.category ?? null,
        image: s.data?.image ? `https://wger.de${s.data.image}` : null,
      })
      if (out.length >= limit) break
    }
    return out
  } catch (err) {
    console.error('Wger search error:', err)
    return []
  }
}
