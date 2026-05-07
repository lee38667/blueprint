export interface AISnapshot {
  tasks: Array<{
    title: string
    status: string
    priority?: string | null
    project?: string | null
    due_date?: string | null
    goal_id?: string | null
  }>
  goals: Array<{
    title: string
    status: string
    target_date?: string | null
  }>
  moods: Array<{
    mood_label: string | null
    mood_score: number | null
    stress_score: number | null
    created_at: string
  }>
  bodyStats: Array<{
    recorded_at: string
    weight: number | null
    sleep_hours: number | null
    water_ml: number | null
    stress: number | null
  }>
  bodyWorkouts?: Array<{
    body_part: string
    reps: number | null
    sets: number | null
    notes: string | null
    logged_at: string
  }>
  finance?: {
    balance?: number | null
    savings?: number | null
    targets?: Array<{ month: string; target_amount: number }>
  }
  notes?: Array<{ title?: string | null; content?: string | null }>
  habits?: Array<{ name: string; frequency: string; currentStreak: number }>
}

export type HunterStatKey = 'strength' | 'agility' | 'endurance' | 'recovery' | 'focus'

export interface HunterRadarStat {
  key: HunterStatKey
  label: string
  value: number
  reason: string
}

export interface HunterRadarInsight {
  summary: string
  stats: HunterRadarStat[]
  actions: string[]
}

export interface BrainInsight {
  summary: string
  taskSuggestions: string[]
  goalHighlights: string[]
  wellnessNote?: string
  riskAlerts?: string[]
  hunterRadar?: HunterRadarInsight
}

export function hashSnapshot(snapshot: AISnapshot): string {
  const raw = JSON.stringify(snapshot)
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i)
    hash |= 0
  }
  return hash.toString()
}

export function formatSnapshotForAI(snapshot: AISnapshot): string {
  const taskText = snapshot.tasks.length
    ? snapshot.tasks
        .slice(0, 8)
        .map((t) => `${t.status} | ${t.title}${t.project ? ` (${t.project})` : ''}${t.due_date ? ` due ${t.due_date}` : ''}`)
        .join('\n')
    : 'No tasks recorded.'

  const goalText = snapshot.goals.length
    ? snapshot.goals
        .slice(0, 6)
        .map((g) => `${g.status} | ${g.title}${g.target_date ? ` (target ${g.target_date})` : ''}`)
        .join('\n')
    : 'No goals logged.'

  const moodText = snapshot.moods.length
    ? snapshot.moods
        .slice(-7)
        .map((m) => {
          const day = new Date(m.created_at).toISOString().slice(0, 10)
          return `${day}: mood ${m.mood_score ?? 'n/a'}, stress ${m.stress_score ?? 'n/a'}, label ${m.mood_label ?? 'n/a'}`
        })
        .join('\n')
    : 'No mood logs.'

  const bodyText = snapshot.bodyStats.length
    ? snapshot.bodyStats
        .slice(-7)
        .map((b) => {
          const day = new Date(b.recorded_at).toISOString().slice(0, 10)
          return `${day}: weight ${b.weight ?? 'n/a'}, sleep ${b.sleep_hours ?? 'n/a'}, water ${b.water_ml ?? 'n/a'}, stress ${b.stress ?? 'n/a'}`
        })
        .join('\n')
    : 'No body stats yet.'

  const workoutText = snapshot.bodyWorkouts?.length
    ? snapshot.bodyWorkouts
        .slice(-10)
        .map((w) => {
          const day = new Date(w.logged_at).toISOString().slice(0, 10)
          return `${day}: ${w.body_part} | sets ${w.sets ?? 'n/a'} | reps ${w.reps ?? 'n/a'} | ${w.notes ?? 'no notes'}`
        })
        .join('\n')
    : 'No body workouts logged.'

  const financeParts: string[] = []
  if (snapshot.finance?.balance != null) financeParts.push(`Balance $${snapshot.finance.balance}`)
  if (snapshot.finance?.savings != null) financeParts.push(`Savings $${snapshot.finance.savings}`)
  if (snapshot.finance?.targets?.length) {
    financeParts.push('Targets: ' + snapshot.finance.targets.slice(0, 3).map((t) => `${t.month}: $${t.target_amount}`).join(', '))
  }
  const financeText = financeParts.length ? financeParts.join(' | ') : 'No finance data.'

  const noteText = snapshot.notes?.length
    ? snapshot.notes
        .slice(0, 3)
        .map((n) => `${n.title ?? 'Untitled'}: ${(n.content ?? '').slice(0, 80)}`)
        .join('\n')
    : 'No notes provided.'

  const habitText = snapshot.habits?.length
    ? snapshot.habits
        .map((h) => `${h.name} (${h.frequency}) - streak ${h.currentStreak} days`)
        .join('\n')
    : 'No habits tracked.'

  return `Tasks:\n${taskText}\n\nGoals:\n${goalText}\n\nFinance:\n${financeText}\n\nMoods:\n${moodText}\n\nBody Stats:\n${bodyText}\n\nBody Workouts:\n${workoutText}\n\nHabits:\n${habitText}\n\nNotes:\n${noteText}`
}
