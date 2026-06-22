import type { NextApiRequest, NextApiResponse } from 'next'
import {
  themeForDay,
  referenceForDay,
  getThemeByKey,
  type ScriptureTheme,
} from '../../../lib/scriptureThemes'

/**
 * Topic-based daily scripture.
 *
 * GET /api/scripture/daily            → today's themed verse
 * GET /api/scripture/daily?offset=1   → "refresh": next verse/theme in rotation
 * GET /api/scripture/daily?theme=peace→ a verse from a specific theme
 *
 * Verse text comes from the free, key-less bible-api.com. No auth required —
 * this is generic, non-personal content rendered on first dashboard paint.
 */

interface DailyScripture {
  theme: string
  themeKey: string
  reference: string
  text: string
  encouragement: string
  translation: string
}

type Data = DailyScripture | { error: string }

const BIBLE_API = 'https://bible-api.com'

async function fetchVerse(reference: string): Promise<{ text: string; reference: string; translation: string } | null> {
  try {
    const url = `${BIBLE_API}/${encodeURIComponent(reference)}?translation=web`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    const data: any = await res.json()
    const text = String(data?.text ?? '').replace(/\s+/g, ' ').trim()
    if (!text) return null
    return {
      text,
      reference: data?.reference ?? reference,
      translation: data?.translation_name ?? 'World English Bible',
    }
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const offset = Math.max(0, Math.min(366, parseInt(String(req.query.offset ?? '0'), 10) || 0))
  const themeParam = typeof req.query.theme === 'string' ? req.query.theme : null

  const now = new Date()
  const theme: ScriptureTheme = themeParam ? getThemeByKey(themeParam) ?? themeForDay(now, offset) : themeForDay(now, offset)
  let reference = referenceForDay(theme, now, offset)

  let verse = await fetchVerse(reference)

  // If the chosen reference fails, walk a couple of fallbacks within the theme.
  if (!verse) {
    for (let i = 1; i <= 2 && !verse; i++) {
      reference = referenceForDay(theme, now, offset + i)
      verse = await fetchVerse(reference)
    }
  }

  // Last-resort fallback so the card always renders something encouraging.
  if (!verse) {
    return res.status(200).json({
      theme: theme.label,
      themeKey: theme.key,
      reference: 'Lamentations 3:22-23',
      text: 'The LORD’s loving kindnesses do not cease; his mercies are new every morning. Great is your faithfulness.',
      encouragement: theme.encouragement,
      translation: 'World English Bible',
    })
  }

  // Cache at the edge for the day; verse is stable per (theme, offset, day).
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  return res.status(200).json({
    theme: theme.label,
    themeKey: theme.key,
    reference: verse.reference,
    text: verse.text,
    encouragement: theme.encouragement,
    translation: verse.translation,
  })
}
