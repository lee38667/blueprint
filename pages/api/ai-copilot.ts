import type { NextApiRequest, NextApiResponse } from 'next'
import { AISnapshot, BrainInsight, HunterRadarInsight, HunterRadarStat, formatSnapshotForAI } from '../../lib/aiSnapshot'
import { authGuard, getServiceClient } from '../../lib/apiAuth'
import { getUpcomingEvents, formatCalendarSummary } from '../../lib/serverCalendar'
import { aiText, aiJSON, AI_MODELS } from '../../lib/aiClient'

type DataAction = {
  type: 'body_stats' | 'mood' | 'finance' | 'task' | 'note' | 'goal' | 'unknown'
  data: Record<string, any>
  confirmation: string
}

type Data = {
  insight?: string
  brain?: BrainInsight
  action?: DataAction
  error?: string
}

type Mode = 'mood' | 'focus' | 'brain' | 'record'

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function buildFallbackHunterActions(stats: HunterRadarStat[]): string[] {
  const ordered = [...stats].sort((left, right) => left.value - right.value)
  return ordered.slice(0, 3).map((stat) => {
    if (stat.key === 'recovery') return 'Recovery is lagging: log one short body session, drink water, and protect a 7+ hour sleep window tonight.'
    if (stat.key === 'focus') return 'Focus is low: clear one task in the next 10 minutes and silence one distraction source before you start.'
    if (stat.key === 'endurance') return 'Endurance is soft: rescue one habit streak with a one-tap completion instead of waiting for ideal energy.'
    if (stat.key === 'agility') return 'Agility dipped: finish a small pending task to reduce open loops and restore movement.'
    return 'Strength needs support: do one mood-lifting reset like a walk, sunlight, or a quick win before harder work.'
  })
}

function buildFallbackHunterRadar(snapshot: AISnapshot): HunterRadarInsight {
  const validMoods = snapshot.moods.filter((m) => typeof m.mood_score === 'number')
  const strength = validMoods.length
    ? clamp((validMoods.reduce((sum, mood) => sum + (mood.mood_score ?? 0), 0) / validMoods.length) * 10)
    : 55

  const completedTasks = snapshot.tasks.filter((task) => task.status === 'done').length
  const agility = snapshot.tasks.length ? clamp((completedTasks / snapshot.tasks.length) * 100) : 45

  const endurance = snapshot.habits?.length
    ? clamp(snapshot.habits.reduce((sum, habit) => sum + Math.min(habit.currentStreak * 12, 100), 0) / snapshot.habits.length)
    : 40

  const recovery = snapshot.bodyWorkouts?.length
    ? clamp(Math.min(snapshot.bodyWorkouts.length * 14, 100))
    : snapshot.bodyStats.length
      ? clamp(50 + snapshot.bodyStats.slice(-3).filter((item) => (item.sleep_hours ?? 0) >= 7).length * 10)
      : 42

  const activeTasks = snapshot.tasks.filter((task) => task.status !== 'done').length
  const focusBase = snapshot.tasks.length ? (completedTasks / snapshot.tasks.length) * 70 : 35
  const focus = clamp(focusBase + Math.max(0, 30 - activeTasks * 3))

  const stats: HunterRadarStat[] = [
    {
      key: 'strength',
      label: 'Strength',
      value: strength,
      reason: validMoods.length ? 'Based mostly on your recent mood logs and emotional steadiness.' : 'Using a neutral baseline because there are few mood logs yet.',
    },
    {
      key: 'agility',
      label: 'Agility',
      value: agility,
      reason: snapshot.tasks.length ? 'Driven by how much of your recorded task list is actually getting cleared.' : 'Using a baseline until more tasks are recorded.',
    },
    {
      key: 'endurance',
      label: 'Endurance',
      value: endurance,
      reason: snapshot.habits?.length ? 'Built from your current habit streaks and consistency patterns.' : 'Using a baseline until habit streak data grows.',
    },
    {
      key: 'recovery',
      label: 'Recovery',
      value: recovery,
      reason: snapshot.bodyWorkouts?.length ? 'Weighted toward your recent body-workout logs, with body stats acting as backup context.' : 'Estimated from sleep and body logs until more workouts are recorded.',
    },
    {
      key: 'focus',
      label: 'Focus',
      value: focus,
      reason: 'Estimated from your task completion ratio and the current amount of open attention load.',
    },
  ]

  return {
    summary: 'Fallback hunter readout based on your recorded tasks, moods, habits, and body logs.',
    stats,
    actions: buildFallbackHunterActions(stats),
  }
}

function normalizeHunterRadar(input: any, fallback: HunterRadarInsight): HunterRadarInsight {
  const desiredOrder = ['strength', 'agility', 'endurance', 'recovery', 'focus'] as const
  const fallbackMap = new Map(fallback.stats.map((stat) => [stat.key, stat]))

  const normalizedStats: HunterRadarStat[] = desiredOrder.map((key) => {
    const fallbackStat = fallbackMap.get(key)!
    const candidate = Array.isArray(input?.stats)
      ? input.stats.find((item: any) => (item?.key ?? '').toString().toLowerCase() === key)
      : null

    const numericValue = Number(candidate?.value)

    return {
      key,
      label: typeof candidate?.label === 'string' && candidate.label.trim() ? candidate.label.trim() : fallbackStat.label,
      value: Number.isFinite(numericValue) ? clamp(numericValue) : fallbackStat.value,
      reason: typeof candidate?.reason === 'string' && candidate.reason.trim() ? candidate.reason.trim() : fallbackStat.reason,
    }
  })

  const normalizedActions = Array.isArray(input?.actions)
    ? input.actions.filter((action: unknown) => typeof action === 'string' && action.trim()).slice(0, 4)
    : []

  return {
    summary: typeof input?.summary === 'string' && input.summary.trim() ? input.summary.trim() : fallback.summary,
    stats: normalizedStats,
    actions: normalizedActions.length ? normalizedActions : fallback.actions,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, { name: 'ai-copilot', rateLimit: { limit: 40, windowMs: 60_000 } })
  if (!user) return

  const { mood, mode = 'mood', snapshot, message } = req.body as {
    mood?: string
    mode?: Mode
    snapshot?: AISnapshot
    message?: string
  }

  if (!mood && mode === 'mood') {
    return res.status(400).json({ error: 'Mood is required' })
  }

  try {
    let goalsSummary = ''
    let moodSummary = ''
    let calendarSummary = ''

    if (mode === 'focus') {
      try {
        const events = await getUpcomingEvents(user.id)
        calendarSummary = formatCalendarSummary(events)
      } catch (err) {
        console.error('Calendar fetch error in AI:', err)
      }

      const supabaseServer = getServiceClient()

      const { data: goals } = await supabaseServer
        .from('goals')
        .select('title, status, target_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: moods } = await supabaseServer
        .from('mood_logs')
        .select('mood_label, mood_score, stress_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(7)

      if (goals && goals.length) {
        goalsSummary = `Current goals:\n${goals.map((g) => `- [${g.status ?? 'active'}] ${g.title ?? 'Untitled goal'}${g.target_date ? ` (target ${g.target_date})` : ''}`).join('\n')}`
      }

      if (moods && moods.length) {
        moodSummary = `Recent mood check-ins (oldest to newest):\n${moods
          .slice()
          .reverse()
          .map((m) => `${new Date(m.created_at).toISOString().slice(0, 10)}: mood ${m.mood_score ?? 'n/a'}, stress ${m.stress_score ?? 'n/a'}, label ${m.mood_label || 'n/a'}`)
          .join('\n')}`
      }
    }

    const userPrompt =
      mode === 'focus'
        ? `The user reports feeling: ${mood ?? 'unspecified'}.\n\n${calendarSummary || 'No calendar events scheduled.'}\n\n${goalsSummary || 'No goals on record.'}\n\n${moodSummary || 'No recent mood logs.'}\n\nLocal time is .

Given their schedule, goals, mood, and the current time of day, suggest what they should focus on today in 3-5 short bullet points. Be concrete, gentle, realistic for a single day, and behave like an attentive system guide that knows when to nudge harder versus softer.`
        : `The user reports feeling: ${mood}. Respond with a brief, actionable insight and encouragement.`

    if (mode === 'record') {
      if (!message) {
        return res.status(400).json({ error: 'Message is required for record mode' })
      }

      const action = await aiJSON<DataAction>({
        model: AI_MODELS.fast,
        temperature: 0.2,
        maxTokens: 400,
        system: `You are a data extraction assistant. Parse the user's natural language message and extract structured data for recording.

Return JSON with this exact structure:
{
  "type": "body_stats" | "mood" | "finance" | "task" | "note" | "goal" | "unknown",
  "data": { extracted fields based on type },
  "confirmation": "human-friendly confirmation message"
}

Type-specific data fields:
- body_stats: { weight_kg?, height_cm?, body_fat_percentage?, muscle_mass_kg?, bmi?, date? }
- mood: { mood_label, mood_score (1-10), stress_score (1-10)?, note? }
- finance: { type: "income"|"expense", amount, category?, note? }
- task: { title, priority?: "low"|"medium"|"high", due_date?, status?: "todo" }
- note: { title, content, tags? }
- goal: { title, category?, target_date?, description? }
- unknown: {} (if you can't determine the type)

Extract all mentioned values. Use ISO date format (YYYY-MM-DD) for dates. If "today" is mentioned, use today's date.`,
        user: message,
        fallback: {
          type: 'unknown',
          data: {},
          confirmation: "I couldn't understand that. Please try rephrasing.",
        },
      })
      return res.status(200).json({ action })
    }

    if (mode === 'brain') {
      if (!snapshot) {
        return res.status(400).json({ error: 'Snapshot is required for brain mode' })
      }

      const compiled = formatSnapshotForAI(snapshot)
      const fallbackRadar = buildFallbackHunterRadar(snapshot)
      const parsed = await aiJSON<any>({
        model: AI_MODELS.smart,
        temperature: 0.4,
        maxTokens: 1100,
        system:
          'You are the intelligence layer for a personal operating system with a Solo Leveling-inspired hunter dashboard. Analyze grounded personal data and return structured, conservative guidance. Be aware of current local time and shape interventions around what is realistic right now, not just eventually. Base hunter stat values and action recommendations only on the supplied data.',
        user:
          'Use the structured data below to craft JSON with keys summary, taskSuggestions, goalHighlights, wellnessNote, riskAlerts, hunterRadar. ' +
          'Keep each array under 4 items. hunterRadar must contain summary, stats, and actions. ' +
          'stats must be an array of 5 objects with keys key, label, value, reason. ' +
          'The key values must be strength, agility, endurance, recovery, focus. ' +
          'Each value must be an integer from 0 to 100 and each reason must explain which recorded data influenced it. ' +
          'actions must be an array of 2 to 4 short concrete stat-rebalancing actions that target the weakest current stats today. ' +
          'Data:\n' + compiled,
        fallback: {
          summary: 'AI returned an invalid response. Showing fallback hunter stats from your recorded data.',
          taskSuggestions: [],
          goalHighlights: [],
          riskAlerts: ['AI response failed to parse.'],
          hunterRadar: undefined,
        },
      })

      const brain: BrainInsight = {
        summary: parsed.summary ?? 'No summary provided.',
        taskSuggestions: parsed.taskSuggestions ?? [],
        goalHighlights: parsed.goalHighlights ?? [],
        wellnessNote: parsed.wellnessNote,
        riskAlerts: parsed.riskAlerts ?? [],
        hunterRadar: normalizeHunterRadar(parsed.hunterRadar, fallbackRadar),
      }
      return res.status(200).json({ brain })
    }

    const insight =
      (await aiText({
        model: mode === 'focus' ? AI_MODELS.smart : AI_MODELS.fast,
        temperature: 0.6,
        maxTokens: mode === 'focus' ? 400 : 220,
        system:
          'You are Blueprint Sentinel, the living guidance layer of a personal operating system. You are aware of the current local date and time and should speak like an attentive system companion who can gently nudge the user toward the next best action. Keep answers short, specific, and grounded in what is realistic right now.',
        user: userPrompt,
      })) || 'No insight generated.'

    return res.status(200).json({ insight })
  } catch (error) {
    console.error('AI route error:', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}

