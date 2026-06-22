/**
 * Topic-based daily scripture.
 *
 * Instead of a purely random verse, each day surfaces an encouraging THEME
 * (faith, courage, peace, …) with a curated verse from that theme and a short
 * uplifting application note. Selection is deterministic per day so the verse is
 * stable across reloads, and rotates so it stays fresh over time.
 *
 * Verse TEXT is fetched at runtime from the free, key-less bible-api.com; this
 * file only holds references + curated encouragement copy, so it stays small.
 */

export interface ScriptureTheme {
  /** stable key */
  key: string
  /** display label */
  label: string
  /** one-line encouragement that frames the whole theme */
  encouragement: string
  /** curated verse references (bible-api.com understands these, e.g. "Romans 8:28") */
  references: string[]
}

export const SCRIPTURE_THEMES: ScriptureTheme[] = [
  {
    key: 'faith',
    label: 'Faith',
    encouragement: 'Trust grows one step at a time — take today’s step.',
    references: ['Hebrews 11:1', 'Proverbs 3:5-6', 'Mark 11:24', '2 Corinthians 5:7', 'Romans 10:17', 'Matthew 17:20'],
  },
  {
    key: 'courage',
    label: 'Courage',
    encouragement: 'You are not facing today alone — be strong and take heart.',
    references: ['Joshua 1:9', 'Deuteronomy 31:6', 'Psalm 27:1', 'Isaiah 41:10', '1 Corinthians 16:13', '2 Timothy 1:7'],
  },
  {
    key: 'peace',
    label: 'Peace',
    encouragement: 'Let your shoulders drop — peace is offered to you right now.',
    references: ['John 14:27', 'Philippians 4:6-7', 'Isaiah 26:3', 'Psalm 4:8', 'Colossians 3:15', 'Matthew 11:28'],
  },
  {
    key: 'wisdom',
    label: 'Wisdom',
    encouragement: 'Ask for clarity today; it is given generously.',
    references: ['James 1:5', 'Proverbs 2:6', 'Proverbs 9:10', 'Psalm 119:105', 'Colossians 2:3', 'Proverbs 16:3'],
  },
  {
    key: 'provision',
    label: 'Provision',
    encouragement: 'Your needs are seen and met — release the worry of lack.',
    references: ['Philippians 4:19', 'Matthew 6:33', 'Psalm 23:1', 'Matthew 6:26', 'Proverbs 3:9-10', '2 Corinthians 9:8'],
  },
  {
    key: 'healing',
    label: 'Healing',
    encouragement: 'Rest while you mend — restoration is gentle and real.',
    references: ['Psalm 147:3', 'Jeremiah 17:14', 'Isaiah 53:5', 'Psalm 34:18', 'James 5:16', 'Exodus 15:26'],
  },
  {
    key: 'hope',
    label: 'Hope',
    encouragement: 'The story isn’t over — hold on to what is ahead.',
    references: ['Jeremiah 29:11', 'Romans 15:13', 'Romans 8:28', 'Psalm 42:11', 'Lamentations 3:22-23', 'Isaiah 40:31'],
  },
  {
    key: 'strength',
    label: 'Strength',
    encouragement: 'When you run low, a deeper strength carries you.',
    references: ['Isaiah 40:31', 'Philippians 4:13', 'Psalm 28:7', 'Nehemiah 8:10', '2 Corinthians 12:9', 'Ephesians 6:10'],
  },
  {
    key: 'love',
    label: 'Love',
    encouragement: 'You are deeply loved — let that be the ground you stand on.',
    references: ['1 John 4:19', 'Romans 8:38-39', '1 Corinthians 13:4-7', 'John 15:13', 'Zephaniah 3:17', 'Lamentations 3:22'],
  },
  {
    key: 'gratitude',
    label: 'Gratitude',
    encouragement: 'Name one good thing today — thankfulness re-frames everything.',
    references: ['1 Thessalonians 5:18', 'Psalm 100:4', 'Colossians 3:17', 'Psalm 107:1', 'Philippians 4:6', 'James 1:17'],
  },
  {
    key: 'perseverance',
    label: 'Perseverance',
    encouragement: 'Keep going — small faithful steps compound into a finished work.',
    references: ['Galatians 6:9', 'James 1:12', 'Romans 5:3-4', 'Hebrews 12:1', 'Philippians 3:14', '2 Corinthians 4:16-18'],
  },
  {
    key: 'comfort',
    label: 'Comfort',
    encouragement: 'Whatever today holds, you are held too.',
    references: ['Psalm 34:18', 'Matthew 5:4', '2 Corinthians 1:3-4', 'Psalm 23:4', 'John 16:33', 'Isaiah 41:13'],
  },
]

/** Days since the Unix epoch in the given timezone-neutral local date. */
export function dayIndex(date = new Date()): number {
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor(utcMidnight / 86_400_000)
}

/**
 * Deterministic theme for a given day. `offset` lets "refresh" advance to the
 * next theme without losing determinism.
 */
export function themeForDay(date = new Date(), offset = 0): ScriptureTheme {
  const idx = (dayIndex(date) + offset) % SCRIPTURE_THEMES.length
  return SCRIPTURE_THEMES[(idx + SCRIPTURE_THEMES.length) % SCRIPTURE_THEMES.length]
}

/** Deterministic verse reference within a theme for a given day. */
export function referenceForDay(theme: ScriptureTheme, date = new Date(), offset = 0): string {
  const rotation = Math.floor(dayIndex(date) / SCRIPTURE_THEMES.length) + offset
  const i = ((rotation % theme.references.length) + theme.references.length) % theme.references.length
  return theme.references[i]
}

export function getThemeByKey(key: string): ScriptureTheme | undefined {
  return SCRIPTURE_THEMES.find((t) => t.key === key)
}
