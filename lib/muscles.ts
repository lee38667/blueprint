/**
 * Muscle model for the fitness section.
 *
 * - A canonical list of trainable muscle groups split by anterior / posterior view.
 * - A keyword-driven mapper that turns free-text exercise names (as logged in the
 *   gym page) into the primary + secondary muscles they train.
 * - A simple recovery model so the muscle map can show "fresh / worked / sore"
 *   state and surface under-trained groups — the kind of guidance popular
 *   training apps (Hevy, Strong, Fitbod, Caliber) provide.
 *
 * Intentionally dependency-free and data-only so it can be unit-reasoned about
 * and reused by both the UI and the AI coach prompt.
 */

export type MuscleKey =
  | 'chest'
  | 'front_delts'
  | 'biceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'calves'
  | 'traps'
  | 'lats'
  | 'rear_delts'
  | 'triceps'
  | 'lower_back'
  | 'glutes'
  | 'hamstrings'

export type MuscleView = 'front' | 'back'

export interface MuscleMeta {
  key: MuscleKey
  label: string
  view: MuscleView
  /** Recommended recovery window in hours before training again. */
  recoveryHours: number
  /** Larger groups want more weekly sets; used for coverage guidance. */
  weeklySetTarget: number
}

export const MUSCLES: Record<MuscleKey, MuscleMeta> = {
  chest: { key: 'chest', label: 'Chest', view: 'front', recoveryHours: 48, weeklySetTarget: 12 },
  front_delts: { key: 'front_delts', label: 'Front Delts', view: 'front', recoveryHours: 48, weeklySetTarget: 8 },
  biceps: { key: 'biceps', label: 'Biceps', view: 'front', recoveryHours: 48, weeklySetTarget: 10 },
  forearms: { key: 'forearms', label: 'Forearms', view: 'front', recoveryHours: 24, weeklySetTarget: 6 },
  abs: { key: 'abs', label: 'Abs', view: 'front', recoveryHours: 24, weeklySetTarget: 12 },
  obliques: { key: 'obliques', label: 'Obliques', view: 'front', recoveryHours: 24, weeklySetTarget: 8 },
  quads: { key: 'quads', label: 'Quads', view: 'front', recoveryHours: 72, weeklySetTarget: 12 },
  calves: { key: 'calves', label: 'Calves', view: 'front', recoveryHours: 48, weeklySetTarget: 10 },
  traps: { key: 'traps', label: 'Traps', view: 'back', recoveryHours: 48, weeklySetTarget: 8 },
  lats: { key: 'lats', label: 'Lats / Upper Back', view: 'back', recoveryHours: 48, weeklySetTarget: 12 },
  rear_delts: { key: 'rear_delts', label: 'Rear Delts', view: 'back', recoveryHours: 48, weeklySetTarget: 8 },
  triceps: { key: 'triceps', label: 'Triceps', view: 'back', recoveryHours: 48, weeklySetTarget: 10 },
  lower_back: { key: 'lower_back', label: 'Lower Back', view: 'back', recoveryHours: 72, weeklySetTarget: 6 },
  glutes: { key: 'glutes', label: 'Glutes', view: 'back', recoveryHours: 72, weeklySetTarget: 10 },
  hamstrings: { key: 'hamstrings', label: 'Hamstrings', view: 'back', recoveryHours: 72, weeklySetTarget: 10 },
}

export const ALL_MUSCLE_KEYS = Object.keys(MUSCLES) as MuscleKey[]

interface ExercisePattern {
  /** Lowercase substrings that identify the movement. */
  match: string[]
  primary: MuscleKey[]
  secondary?: MuscleKey[]
}

/**
 * Ordered most-specific → most-generic. The first matching pattern wins for the
 * primary classification; later generic patterns still contribute secondaries.
 */
const EXERCISE_PATTERNS: ExercisePattern[] = [
  // Chest
  { match: ['bench press', 'bench', 'chest press', 'push up', 'pushup', 'push-up', 'dip', 'fly', 'flye', 'pec', 'incline press', 'decline press'], primary: ['chest'], secondary: ['front_delts', 'triceps'] },
  // Back — vertical pull
  { match: ['pull up', 'pullup', 'pull-up', 'chin up', 'chinup', 'lat pulldown', 'pulldown'], primary: ['lats'], secondary: ['biceps', 'rear_delts'] },
  // Back — horizontal pull
  { match: ['row', 'pull', 'face pull', 'shrug'], primary: ['lats'], secondary: ['traps', 'rear_delts', 'biceps'] },
  { match: ['deadlift', 'rdl', 'romanian', 'good morning', 'hyperextension', 'back extension'], primary: ['lower_back'], secondary: ['hamstrings', 'glutes', 'traps'] },
  // Shoulders
  { match: ['overhead press', 'ohp', 'shoulder press', 'military press', 'arnold'], primary: ['front_delts'], secondary: ['triceps', 'traps'] },
  { match: ['lateral raise', 'side raise', 'rear delt', 'reverse fly', 'reverse flye'], primary: ['rear_delts'], secondary: ['traps'] },
  { match: ['front raise'], primary: ['front_delts'] },
  // Arms
  { match: ['curl'], primary: ['biceps'], secondary: ['forearms'] },
  { match: ['tricep', 'pushdown', 'skull crusher', 'skullcrusher', 'kickback', 'close grip', 'close-grip'], primary: ['triceps'] },
  { match: ['wrist', 'grip', 'farmer'], primary: ['forearms'] },
  // Legs
  { match: ['squat', 'leg press', 'lunge', 'leg extension', 'step up', 'step-up', 'split squat', 'hack squat'], primary: ['quads'], secondary: ['glutes', 'hamstrings'] },
  { match: ['leg curl', 'hamstring', 'nordic'], primary: ['hamstrings'], secondary: ['glutes'] },
  { match: ['hip thrust', 'glute bridge', 'glute', 'kickback'], primary: ['glutes'], secondary: ['hamstrings'] },
  { match: ['calf', 'calve', 'raise toe'], primary: ['calves'] },
  // Core
  { match: ['crunch', 'sit up', 'situp', 'sit-up', 'plank', 'leg raise', 'ab ', 'hollow', 'rollout'], primary: ['abs'] },
  { match: ['russian twist', 'oblique', 'side bend', 'woodchop', 'side plank'], primary: ['obliques'], secondary: ['abs'] },
]

/** Map a single exercise name to the muscles it trains. */
export function musclesForExercise(name: string): { primary: MuscleKey[]; secondary: MuscleKey[] } {
  const n = (name || '').toLowerCase().trim()
  if (!n) return { primary: [], secondary: [] }
  for (const pattern of EXERCISE_PATTERNS) {
    if (pattern.match.some((m) => n.includes(m))) {
      return { primary: pattern.primary, secondary: pattern.secondary ?? [] }
    }
  }
  return { primary: [], secondary: [] }
}

export interface LoggedExerciseLike {
  name: string
  sets: number
  /** ISO timestamp of when the session was performed. */
  performedAt: string
}

export interface MuscleActivity {
  /** Effective set count over the window (primary = 1.0, secondary = 0.5). */
  sets: number
  /** Most recent training timestamp (ms epoch), or null if never. */
  lastTrained: number | null
  /** Hours since last trained, or null. */
  hoursSince: number | null
}

export type MuscleStatus = 'untrained' | 'recovered' | 'recovering' | 'fatigued'

/**
 * Aggregate logged exercises into per-muscle activity over a rolling window.
 * `now` is injected so this stays pure / testable.
 */
export function aggregateMuscleActivity(
  exercises: LoggedExerciseLike[],
  now: number,
  windowDays = 7
): Record<MuscleKey, MuscleActivity> {
  const windowStart = now - windowDays * 86_400_000
  const result = {} as Record<MuscleKey, MuscleActivity>
  for (const key of ALL_MUSCLE_KEYS) result[key] = { sets: 0, lastTrained: null, hoursSince: null }

  for (const ex of exercises) {
    const performed = new Date(ex.performedAt).getTime()
    if (Number.isNaN(performed)) continue
    const { primary, secondary } = musclesForExercise(ex.name)
    const within = performed >= windowStart
    const apply = (key: MuscleKey, weight: number) => {
      const slot = result[key]
      if (within) slot.sets += (ex.sets || 0) * weight
      if (slot.lastTrained === null || performed > slot.lastTrained) slot.lastTrained = performed
    }
    primary.forEach((k) => apply(k, 1))
    secondary.forEach((k) => apply(k, 0.5))
  }

  for (const key of ALL_MUSCLE_KEYS) {
    const slot = result[key]
    slot.sets = Math.round(slot.sets * 10) / 10
    slot.hoursSince = slot.lastTrained === null ? null : Math.round((now - slot.lastTrained) / 3_600_000)
  }
  return result
}

/** Classify a muscle's readiness from its activity + recovery window. */
export function muscleStatus(key: MuscleKey, activity: MuscleActivity): MuscleStatus {
  if (activity.lastTrained === null) return 'untrained'
  const recovery = MUSCLES[key].recoveryHours
  const h = activity.hoursSince ?? Infinity
  if (h >= recovery) return 'recovered'
  if (h >= recovery * 0.5) return 'recovering'
  return 'fatigued'
}

export const STATUS_META: Record<MuscleStatus, { label: string; color: string; hint: string }> = {
  untrained: { label: 'Untrained', color: '#3f3f46', hint: 'No recent work — add it to a session.' },
  recovered: { label: 'Recovered', color: '#22c55e', hint: 'Fully recovered and ready to train hard.' },
  recovering: { label: 'Recovering', color: '#eab308', hint: 'Still recovering — light work or wait.' },
  fatigued: { label: 'Worked', color: '#ef4444', hint: 'Recently trained — let it rest.' },
}

/** Muscles that are below their weekly set target — candidates to prioritise. */
export function underTrainedMuscles(
  activity: Record<MuscleKey, MuscleActivity>
): Array<{ key: MuscleKey; sets: number; target: number; deficit: number }> {
  return ALL_MUSCLE_KEYS.map((key) => {
    const sets = activity[key].sets
    const target = MUSCLES[key].weeklySetTarget
    return { key, sets, target, deficit: Math.max(0, target - sets) }
  })
    .filter((m) => m.deficit > 0)
    .sort((a, b) => b.deficit - a.deficit)
}
