import type {
  Task,
  Habit,
  HabitLog,
  ReportPeriod,
  PeriodReport,
  TaskReportMetrics,
  HabitReportMetrics,
  HabitReportRow,
  ConcernItem,
  ConcernSeverity,
} from '../types/models'

const DAY_MS = 24 * 60 * 60 * 1000

/** Midnight (local) of the given date. */
function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/** YYYY-MM-DD for a Date (local). */
function dateKey(d: Date): string {
  return startOfDay(d).toLocaleDateString('en-CA') // en-CA renders ISO-like YYYY-MM-DD
}

/** Parse a value that may be an ISO timestamp or a YYYY-MM-DD date string. */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Whole days between two midnights (a - b), can be negative. */
function dayDiff(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS)
}

function severityForDays(days: number): ConcernSeverity {
  if (days > 14) return 'high'
  if (days > 5) return 'medium'
  return 'low'
}

const SEVERITY_RANK: Record<ConcernSeverity, number> = { high: 0, medium: 1, low: 2 }

/**
 * The completion timestamp we attribute to a done task. We prefer updated_at
 * (stamped when the task is marked done) and fall back to created_at so older
 * rows without an updated_at still count somewhere sensible.
 */
function completionDate(task: Task): Date | null {
  return toDate(task.updated_at) ?? toDate(task.created_at)
}

function buildTaskMetrics(
  tasks: Task[],
  period: ReportPeriod,
  now: Date,
  rangeStart: Date,
): TaskReportMetrics {
  const today = startOfDay(now)
  const daysInPeriod = period === 'week' ? 7 : 30

  const completedInPeriodTasks = tasks.filter((t) => {
    if (t.status !== 'done') return false
    const done = completionDate(t)
    return !!done && done.getTime() >= rangeStart.getTime() && done.getTime() <= now.getTime()
  })

  const createdInPeriod = tasks.filter((t) => {
    const created = toDate(t.created_at)
    return !!created && created.getTime() >= rangeStart.getTime() && created.getTime() <= now.getTime()
  }).length

  // Open backlog that already existed during the period (created on/before now, still not done).
  const openBacklog = tasks.filter(
    (t) => t.status !== 'done' && (toDate(t.created_at)?.getTime() ?? 0) <= now.getTime(),
  ).length

  const completedInPeriod = completedInPeriodTasks.length
  const denom = completedInPeriod + openBacklog
  const completionRate = denom > 0 ? Math.round((completedInPeriod / denom) * 100) : 0
  const avgCompletionsPerDay = Math.round((completedInPeriod / daysInPeriod) * 10) / 10

  const activeCount = tasks.filter((t) => t.status !== 'done').length
  const overdueCount = tasks.filter((t) => {
    if (t.status === 'done' || !t.due_date) return false
    const due = toDate(t.due_date)
    return !!due && startOfDay(due).getTime() < today.getTime()
  }).length

  // On-time vs late among due-dated completions in the period.
  let completedOnTime = 0
  let completedLate = 0
  for (const t of completedInPeriodTasks) {
    if (!t.due_date) continue
    const done = completionDate(t)
    if (!done) continue
    if (dateKey(done) > t.due_date.slice(0, 10)) completedLate += 1
    else completedOnTime += 1
  }
  const dueCompletions = completedOnTime + completedLate
  const onTimeRate = dueCompletions > 0 ? Math.round((completedOnTime / dueCompletions) * 100) : 100

  // Trend: week → 7 daily buckets; month → 5 weekly buckets.
  const trendLabels: string[] = []
  const trendCompletions: number[] = []
  if (period === 'week') {
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = startOfDay(new Date(now.getTime() - offset * DAY_MS))
      trendLabels.push(day.toLocaleDateString('en-US', { weekday: 'short' }))
      trendCompletions.push(
        completedInPeriodTasks.filter((t) => {
          const done = completionDate(t)
          return !!done && dateKey(done) === dateKey(day)
        }).length,
      )
    }
  } else {
    const bucketCount = 5
    for (let b = bucketCount - 1; b >= 0; b -= 1) {
      const bucketEnd = startOfDay(new Date(now.getTime() - b * 7 * DAY_MS))
      const bucketStart = new Date(bucketEnd.getTime() - 6 * DAY_MS)
      trendLabels.push(bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      trendCompletions.push(
        completedInPeriodTasks.filter((t) => {
          const done = completionDate(t)
          if (!done) return false
          const k = startOfDay(done).getTime()
          return k >= bucketStart.getTime() && k <= bucketEnd.getTime()
        }).length,
      )
    }
  }

  return {
    completedInPeriod,
    createdInPeriod,
    completionRate,
    avgCompletionsPerDay,
    activeCount,
    overdueCount,
    completedOnTime,
    completedLate,
    onTimeRate,
    trendLabels,
    trendCompletions,
  }
}

function currentStreak(logs: string[], now: Date): number {
  const set = new Set(logs)
  let streak = 0
  for (let i = 0; i < 366; i += 1) {
    const day = dateKey(new Date(now.getTime() - i * DAY_MS))
    if (set.has(day)) {
      streak += 1
    } else if (i === 0) {
      continue // today not logged yet — keep checking from yesterday
    } else {
      break
    }
  }
  return streak
}

function buildHabitMetrics(
  habits: Habit[],
  habitLogs: HabitLog[],
  period: ReportPeriod,
  now: Date,
  rangeStart: Date,
): HabitReportMetrics {
  const daysInPeriod = period === 'week' ? 7 : 30

  const rows: HabitReportRow[] = habits.map((habit) => {
    const created = toDate(habit.created_at) ?? rangeStart
    const effectiveStart = created.getTime() > rangeStart.getTime() ? created : rangeStart
    const daysExisted = Math.max(1, Math.min(daysInPeriod, dayDiff(now, effectiveStart) + 1))

    const expected = habit.frequency === 'weekly' ? Math.max(1, Math.ceil(daysExisted / 7)) : daysExisted

    const logsForHabit = habitLogs
      .filter((l) => l.habit_id === habit.id && l.completed)
      .map((l) => l.logged_at.slice(0, 10))

    const completed = logsForHabit.filter((d) => {
      const day = toDate(d)
      return !!day && startOfDay(day).getTime() >= rangeStart.getTime() && startOfDay(day).getTime() <= now.getTime()
    }).length

    const adherence = Math.min(100, Math.round((completed / expected) * 100))
    const status: HabitReportRow['status'] = adherence >= 80 ? 'maintained' : adherence >= 50 ? 'building' : 'at_risk'

    return {
      habitId: habit.id,
      name: habit.name,
      frequency: habit.frequency,
      expected,
      completed,
      adherence,
      currentStreak: currentStreak(logsForHabit, now),
      status,
    }
  })

  rows.sort((a, b) => b.adherence - a.adherence)

  const maintainedCount = rows.filter((r) => r.status === 'maintained').length
  const atRiskCount = rows.filter((r) => r.status === 'at_risk').length
  const overallAdherence = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + r.adherence, 0) / rows.length)
    : 0

  return { rows, maintainedCount, atRiskCount, overallAdherence }
}

function buildConcerns(tasks: Task[], period: ReportPeriod, now: Date, rangeStart: Date): ConcernItem[] {
  const today = startOfDay(now)
  const concerns: ConcernItem[] = []

  for (const t of tasks) {
    const due = toDate(t.due_date)

    // Overdue & still incomplete.
    if (t.status !== 'done' && due && startOfDay(due).getTime() < today.getTime()) {
      const days = dayDiff(today, due)
      concerns.push({
        id: `overdue-${t.id}`,
        kind: 'overdue',
        title: t.title,
        detail: `Overdue by ${days} day${days === 1 ? '' : 's'} — still ${t.status === 'in_progress' ? 'in progress' : 'not started'}.`,
        severity: severityForDays(days),
        days,
      })
      continue
    }

    // Completed, but well after its due date (within this period).
    if (t.status === 'done' && due) {
      const done = completionDate(t)
      if (done && done.getTime() >= rangeStart.getTime() && dateKey(done) > t.due_date!.slice(0, 10)) {
        const days = dayDiff(done, due)
        if (days >= 1) {
          concerns.push({
            id: `late-${t.id}`,
            kind: 'completed_late',
            title: t.title,
            detail: `Completed ${days} day${days === 1 ? '' : 's'} after it was due.`,
            severity: severityForDays(days),
            days,
          })
        }
      }
      continue
    }

    // Stalled: never started and sitting untouched for 14+ days.
    if (t.status === 'todo') {
      const created = toDate(t.created_at)
      if (created) {
        const ageDays = dayDiff(today, created)
        if (ageDays >= 14) {
          concerns.push({
            id: `stalled-${t.id}`,
            kind: 'stalled',
            title: t.title,
            detail: `Created ${ageDays} days ago and never started.`,
            severity: ageDays > 30 ? 'high' : 'medium',
            days: ageDays,
          })
          continue
        }
      }
    }

    // High-priority work with no due date is easy to lose track of.
    if (t.status !== 'done' && t.priority === 'high' && !t.due_date) {
      concerns.push({
        id: `nodue-${t.id}`,
        kind: 'no_due_date',
        title: t.title,
        detail: 'High priority but has no due date — schedule it so it does not slip.',
        severity: 'low',
      })
    }
  }

  concerns.sort((a, b) => {
    if (SEVERITY_RANK[a.severity] !== SEVERITY_RANK[b.severity]) {
      return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    }
    return (b.days ?? 0) - (a.days ?? 0)
  })

  return concerns
}

function buildHeadline(tasks: TaskReportMetrics, habits: HabitReportMetrics, concerns: ConcernItem[], period: ReportPeriod): string {
  const span = period === 'week' ? 'week' : 'month'
  const parts: string[] = []
  parts.push(
    `You completed ${tasks.completedInPeriod} task${tasks.completedInPeriod === 1 ? '' : 's'} this ${span} (avg ${tasks.avgCompletionsPerDay}/day).`,
  )
  if (habits.rows.length) {
    parts.push(`Maintained ${habits.maintainedCount} of ${habits.rows.length} habit${habits.rows.length === 1 ? '' : 's'}.`)
  }
  const highConcerns = concerns.filter((c) => c.severity === 'high').length
  if (concerns.length === 0) {
    parts.push('No areas of concern — nicely on top of things.')
  } else if (highConcerns > 0) {
    parts.push(`${highConcerns} item${highConcerns === 1 ? '' : 's'} need urgent attention.`)
  } else {
    parts.push(`${concerns.length} item${concerns.length === 1 ? '' : 's'} to keep an eye on.`)
  }
  return parts.join(' ')
}

/**
 * Build a full weekly or monthly report from raw tasks + habits.
 * `now` is injectable for deterministic testing.
 */
export function buildReport(
  tasks: Task[],
  habits: Habit[],
  habitLogs: HabitLog[],
  period: ReportPeriod,
  now: Date = new Date(),
): PeriodReport {
  const daysInPeriod = period === 'week' ? 7 : 30
  const rangeStart = startOfDay(new Date(now.getTime() - (daysInPeriod - 1) * DAY_MS))

  const taskMetrics = buildTaskMetrics(tasks, period, now, rangeStart)
  const habitMetrics = buildHabitMetrics(habits, habitLogs, period, now, rangeStart)
  const concerns = buildConcerns(tasks, period, now, rangeStart)

  return {
    period,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: now.toISOString(),
    daysInPeriod,
    generatedAt: now.toISOString(),
    headline: buildHeadline(taskMetrics, habitMetrics, concerns, period),
    tasks: taskMetrics,
    habits: habitMetrics,
    concerns,
  }
}

export default buildReport
