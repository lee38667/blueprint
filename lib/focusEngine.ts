import type { AISnapshot } from './aiSnapshot'
import type { MotivationItem } from '../hooks/useMotivationBoard'

export interface MicroStep {
  id: string
  title: string
  minutes: number
}

export interface EnergyProfile {
  label: 'low' | 'steady' | 'high'
  focusMinutes: number
  breakMinutes: number
  avgMood: number | null
  avgStress: number | null
}

export interface AttentionIntervention {
  easyWin: string | null
  procrastinationWarning: string | null
  cbtTip: string | null
  hyperfocusWarning: string | null
  nextSmallestStep: string | null
}

export interface AchievementBadge {
  label: string
  tone: 'accent' | 'success' | 'warning'
}

function average(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))
  if (!valid.length) return null
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

function keywordTemplate(taskTitle: string): string[] {
  const lower = taskTitle.toLowerCase()

  if (lower.includes('email') || lower.includes('reply')) {
    return [
      'Open the inbox and star the exact thread.',
      'Write a one-line draft only.',
      'Add one detail or attachment.',
      'Send it before editing again.'
    ]
  }

  if (lower.includes('call') || lower.includes('phone')) {
    return [
      'Find the number or contact card.',
      'Write the first sentence you want to say.',
      'Start the call timer and press dial.',
      'Capture one follow-up note.'
    ]
  }

  if (lower.includes('write') || lower.includes('report') || lower.includes('essay')) {
    return [
      'Open the document and title it.',
      'Write three rough bullet points.',
      'Turn one bullet into a messy paragraph.',
      'Leave yourself the next sentence to continue.'
    ]
  }

  if (lower.includes('clean') || lower.includes('organize')) {
    return [
      'Set a two-minute timer.',
      'Clear one visible surface.',
      'Put five items back where they belong.',
      'Stop and notice the progress made.'
    ]
  }

  if (lower.includes('pay') || lower.includes('budget') || lower.includes('finance')) {
    return [
      'Open the account or bill page.',
      'Confirm the amount due.',
      'Make the payment or draft the transfer.',
      'Log the outcome in one sentence.'
    ]
  }

  return [
    `Open the place where "${taskTitle}" happens.`,
    'Do the smallest visible setup step.',
    'Work for one tiny sprint only.',
    'Leave a clear restart point for later.'
  ]
}

export function getEnergyProfile(snapshot: Pick<AISnapshot, 'moods' | 'bodyStats'>): EnergyProfile {
  const avgMood = average(snapshot.moods.slice(-5).map((entry) => entry.mood_score))
  const stressFromMoods = average(snapshot.moods.slice(-5).map((entry) => entry.stress_score))
  const stressFromBody = average(snapshot.bodyStats.slice(-5).map((entry) => entry.stress))
  const avgStress = average([stressFromMoods, stressFromBody])

  if ((avgStress ?? 0) >= 7 || (avgMood ?? 10) <= 4) {
    return {
      label: 'low',
      focusMinutes: 10,
      breakMinutes: 8,
      avgMood,
      avgStress,
    }
  }

  if ((avgMood ?? 0) >= 7 && (avgStress ?? 0) <= 4) {
    return {
      label: 'high',
      focusMinutes: 30,
      breakMinutes: 5,
      avgMood,
      avgStress,
    }
  }

  return {
    label: 'steady',
    focusMinutes: 20,
    breakMinutes: 6,
    avgMood,
    avgStress,
  }
}

export function generateMicroSteps(taskTitle: string, profile: EnergyProfile): MicroStep[] {
  const baseMinutes = profile.label === 'low' ? 2 : profile.label === 'high' ? 5 : 3
  return keywordTemplate(taskTitle)
    .slice(0, profile.label === 'low' ? 4 : 5)
    .map((title, index) => ({
      id: `${taskTitle}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title,
      minutes: Math.min(5, baseMinutes + (index % 2)),
    }))
}

export function getNextSmallestStep(label: string, profile: EnergyProfile): string {
  if (profile.label === 'low') {
    return `Low-energy mode: open ${label.toLowerCase()} and do the first visible action for two minutes.`
  }
  if (profile.label === 'high') {
    return `You have enough runway for a bigger bite: start ${label.toLowerCase()} with a five-minute sprint.`
  }
  return `Steady mode: begin ${label.toLowerCase()} with one three-minute starter step.`
}

export function getAttentionIntervention(snapshot: AISnapshot): AttentionIntervention {
  const openTasks = snapshot.tasks.filter((task) => task.status !== 'done')
  const easyWinTask = openTasks.find((task) => task.priority !== 'high') ?? openTasks[0]
  const profile = getEnergyProfile(snapshot)
  const lowMood = (profile.avgMood ?? 10) <= 4
  const highStress = (profile.avgStress ?? 0) >= 7
  const stalledCount = openTasks.filter((task) => task.status === 'todo').length
  const inProgressCount = openTasks.filter((task) => task.status === 'in_progress').length

  return {
    easyWin: easyWinTask ? `Switch to the easy win: ${easyWinTask.title}` : null,
    procrastinationWarning:
      lowMood || highStress || stalledCount >= 5
        ? 'Your data suggests initiation friction right now. Shrink the task until it feels almost too easy to fail.'
        : null,
    cbtTip:
      lowMood || highStress
        ? 'Try a CBT reframe: "I only need to start, not finish. Two minutes counts as progress."'
        : null,
    hyperfocusWarning:
      inProgressCount >= 2 && highStress
        ? 'Possible hyperfocus risk: stress is elevated while multiple tasks are already in progress. Schedule a break before pushing further.'
        : null,
    nextSmallestStep: easyWinTask ? getNextSmallestStep(easyWinTask.title, profile) : null,
  }
}

export function getAchievementBadges(snapshot: AISnapshot): AchievementBadge[] {
  const completedTasks = snapshot.tasks.filter((task) => task.status === 'done').length
  const bestHabitStreak = Math.max(0, ...(snapshot.habits ?? []).map((habit) => habit.currentStreak))
  const activeGoals = snapshot.goals.filter((goal) => goal.status === 'active').length
  const badges: AchievementBadge[] = []

  if (completedTasks >= 1) badges.push({ label: 'Momentum', tone: 'success' })
  if (completedTasks >= 5) badges.push({ label: 'Closer', tone: 'accent' })
  if (bestHabitStreak >= 3) badges.push({ label: 'Streak Keeper', tone: 'accent' })
  if (bestHabitStreak >= 7) badges.push({ label: 'Consistency Run', tone: 'success' })
  if (activeGoals >= 3) badges.push({ label: 'Big Picture', tone: 'warning' })

  return badges.slice(0, 4)
}

export function getRewardMessage(items: MotivationItem[]): string {
  const reward = items.find((item) => item.title || item.body)
  if (!reward) {
    return 'Tiny win locked in. Keep the streak warm.'
  }
  return reward.title || reward.body || 'Tiny win locked in. Keep the streak warm.'
}

export function getNotificationReason(title: string, dueAt?: string | null): string {
  if (/habit/i.test(title)) return 'Why now: this protects an existing streak before it slips.'
  if (/overdue/i.test(title)) return 'Why now: overdue work compounds stress fastest when it stays invisible.'
  if (/stress/i.test(title)) return 'Why now: your recent mood and stress data suggest recovery should come before more load.'
  if (/goal/i.test(title)) return 'Why now: the target date is close enough that a small action still changes the outcome.'
  if (dueAt) return `Why now: this reminder is grouped around ${new Date(dueAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`
  return 'Why now: this is the lightest-touch moment to nudge you before the task grows teeth.'
}

export function getGentleNudge(title: string): string {
  if (/habit/i.test(title)) return 'Gentle poke: one quick check-in keeps the chain alive.'
  if (/overdue/i.test(title)) return 'Gentle poke: clear one easy piece and the pressure drops.'
  if (/stress/i.test(title)) return 'Gentle poke: a break is productive if it lowers the next hour of friction.'
  return 'Gentle poke: start with the smallest visible move, not the whole task.'
}
