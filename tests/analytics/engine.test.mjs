/**
 * Unit tests for the analytics engine (lib/analyticsEngine.ts).
 *
 * The TS engine is transpiled to .tmp-test/ before this runs (see npm script
 * `test:analytics`). All dates are fixed so assertions are deterministic.
 */
import assert from 'node:assert/strict'
import { buildReport } from '../../.tmp-test/lib/analyticsEngine.js'

const NOW = new Date('2026-06-21T12:00:00')
const iso = (s) => new Date(s).toISOString()

const tasks = [
  // Completed 2 days after its due date → completed-late, counts in period.
  { id: 't1', title: 'Late finish', priority: 'normal', status: 'done', project: null, due_date: '2026-06-18', goal_id: null, created_at: iso('2026-06-16'), updated_at: iso('2026-06-20') },
  // Completed before its due date → on-time, counts in period.
  { id: 't2', title: 'On time', priority: 'normal', status: 'done', project: null, due_date: '2026-06-20', goal_id: null, created_at: iso('2026-06-16'), updated_at: iso('2026-06-19') },
  // Overdue and still open.
  { id: 't3', title: 'Overdue open', priority: 'normal', status: 'todo', project: null, due_date: '2026-06-10', goal_id: null, created_at: iso('2026-06-05'), updated_at: null },
  // Old, never started, no due date → stalled.
  { id: 't4', title: 'Forgotten', priority: 'normal', status: 'todo', project: null, due_date: null, goal_id: null, created_at: iso('2026-05-01'), updated_at: null },
  // High priority, open, no due date → no_due_date concern.
  { id: 't5', title: 'Important, unscheduled', priority: 'high', status: 'todo', project: null, due_date: null, goal_id: null, created_at: iso('2026-06-19'), updated_at: null },
]

const habits = [
  { id: 'h1', name: 'Read', frequency: 'daily', created_at: iso('2026-06-01') },
  { id: 'h2', name: 'Review week', frequency: 'weekly', created_at: iso('2026-06-01') },
]

const habitLogs = [
  // h1 completed on 6 of the last 7 days (missing today).
  ...['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'].map((d, i) => ({ id: `l${i}`, habit_id: 'h1', logged_at: d, completed: true })),
  // h2 completed once this week.
  { id: 'lw', habit_id: 'h2', logged_at: '2026-06-18', completed: true },
]

const report = buildReport(tasks, habits, habitLogs, 'week', NOW)

let passed = 0
function check(name, cond) {
  assert.ok(cond, name)
  passed += 1
  console.log(`  PASS ${name}`)
}

// Task metrics
check('2 tasks completed in period', report.tasks.completedInPeriod === 2)
check('1 completed on time', report.tasks.completedOnTime === 1)
check('1 completed late', report.tasks.completedLate === 1)
check('on-time rate is 50%', report.tasks.onTimeRate === 50)
check('1 overdue open task', report.tasks.overdueCount === 1)
check('3 active tasks', report.tasks.activeCount === 3)
check('avg/day = 2/7 rounded to 0.3', report.tasks.avgCompletionsPerDay === 0.3)
check('trend has 7 daily buckets', report.tasks.trendLabels.length === 7 && report.tasks.trendCompletions.length === 7)
check('trend sums to completions', report.tasks.trendCompletions.reduce((a, b) => a + b, 0) === 2)

// Habit metrics
const h1 = report.habits.rows.find((r) => r.habitId === 'h1')
const h2 = report.habits.rows.find((r) => r.habitId === 'h2')
check('h1 adherence ~86%', h1.adherence === 86)
check('h1 streak is 6', h1.currentStreak === 6)
check('h1 maintained', h1.status === 'maintained')
check('h2 weekly adherence 100%', h2.adherence === 100)
check('2 habits maintained', report.habits.maintainedCount === 2)

// Concerns
const kinds = report.concerns.map((c) => c.kind)
check('has overdue concern', kinds.includes('overdue'))
check('has completed_late concern', kinds.includes('completed_late'))
check('has stalled concern', kinds.includes('stalled'))
check('has no_due_date concern', kinds.includes('no_due_date'))
const overdue = report.concerns.find((c) => c.kind === 'overdue')
check('overdue is 11 days, medium severity', overdue.days === 11 && overdue.severity === 'medium')

// Headline
check('headline mentions completions', /completed 2 task/i.test(report.headline))

console.log(`\n${passed} assertions passed.`)
