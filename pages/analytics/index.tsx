import { useMemo } from 'react'
import Layout from '../../components/Layout'
import PageContainer from '../../components/PageContainer'
import Card from '../../components/Card'
import Button from '../../components/Button'
import MetricCard from '../../components/MetricCard'
import ChartComponent from '../../components/Chart'
import { CardSkeleton } from '../../components/Skeleton'
import { Icons } from '../../components/icons'
import { useReports } from '../../hooks/useReports'
import { exportReportToCSV } from '../../lib/csvExport'
import type { ConcernItem, HabitReportRow, ReportPeriod } from '../../types/models'

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
]

const habitStatusMeta: Record<HabitReportRow['status'], { label: string; badge: string; bar: string }> = {
  maintained: { label: 'Maintained', badge: 'badge-success', bar: 'var(--color-success)' },
  building: { label: 'Building', badge: 'badge-accent', bar: 'var(--theme-accent)' },
  at_risk: { label: 'At risk', badge: 'badge-warning', bar: 'var(--color-warning)' },
}

const severityMeta: Record<ConcernItem['severity'], { badge: string; color: string }> = {
  high: { badge: 'badge-error', color: 'var(--color-error)' },
  medium: { badge: 'badge-warning', color: 'var(--color-warning)' },
  low: { badge: 'badge-info', color: 'var(--color-info)' },
}

function SegmentedToggle({ period, onChange }: { period: ReportPeriod; onChange: (p: ReportPeriod) => void }) {
  return (
    <div
      className="inline-flex rounded-lg p-1 gap-1"
      style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
      role="tablist"
      aria-label="Report period"
    >
      {PERIODS.map((p) => {
        const active = p.key === period
        return (
          <button
            key={p.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p.key)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              background: active ? 'var(--theme-accent)' : 'transparent',
              color: active ? 'var(--theme-accent-text)' : 'var(--theme-text-dim)',
            }}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

export default function AnalyticsPage() {
  const { period, setPeriod, report, hasData, loading } = useReports('week')

  const maxConcerns = 12
  const visibleConcerns = useMemo(() => report.concerns.slice(0, maxConcerns), [report.concerns])
  const concernOverflow = report.concerns.length - visibleConcerns.length

  return (
    <Layout>
      <PageContainer>
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-xl">Analytics</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              {report.period === 'week' ? 'Last 7 days' : 'Last 30 days'} · task completion, habit adherence, and areas of concern.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SegmentedToggle period={period} onChange={setPeriod} />
            <Button
              variant="outline"
              disabled={!hasData}
              icon={<Icons.Download size="sm" />}
              onClick={() => exportReportToCSV(report)}
            >
              Export
            </Button>
          </div>
        </header>

        {loading && !hasData ? (
          <Card><CardSkeleton className="h-28" /></Card>
        ) : !hasData ? (
          <Card>
            <div className="py-12 text-center">
              <div className="inline-flex p-3 rounded-xl mb-3" style={{ background: 'var(--theme-surface)', color: 'var(--theme-accent)' }}>
                <Icons.Analytics size="lg" />
              </div>
              <h3 className="heading-sm mb-1">No data to report yet</h3>
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                Add a few tasks and habits — your weekly and monthly reports will build automatically.
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Headline summary */}
            <div className="panel-glass rounded-2xl p-5 md:p-6 flex items-start gap-4 accent-gradient">
              <div className="flex-shrink-0 p-2.5 rounded-xl" style={{ background: 'var(--theme-surface)', color: 'var(--theme-accent)' }}>
                <Icons.TrendingUp />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--theme-text-muted)' }}>
                  {report.period === 'week' ? 'Weekly' : 'Monthly'} summary
                </p>
                <p className="text-base md:text-lg" style={{ color: 'var(--theme-text)' }}>{report.headline}</p>
              </div>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
              <MetricCard
                label="Completed"
                value={report.tasks.completedInPeriod}
                sublabel={`${report.tasks.createdInPeriod} created`}
                tone="accent"
                icon={<Icons.Check size="sm" />}
              />
              <MetricCard
                label="Avg / day"
                value={report.tasks.avgCompletionsPerDay}
                sublabel="tasks completed"
              />
              <MetricCard
                label="Completion"
                value={`${report.tasks.completionRate}%`}
                sublabel="of your plate"
                tone={report.tasks.completionRate >= 60 ? 'success' : report.tasks.completionRate >= 30 ? 'warning' : 'danger'}
              />
              <MetricCard
                label="On-time"
                value={`${report.tasks.onTimeRate}%`}
                sublabel={`${report.tasks.completedLate} late`}
                tone={report.tasks.onTimeRate >= 80 ? 'success' : report.tasks.onTimeRate >= 50 ? 'warning' : 'danger'}
              />
              <MetricCard
                label="Active"
                value={report.tasks.activeCount}
                sublabel="still open"
              />
              <MetricCard
                label="Overdue"
                value={report.tasks.overdueCount}
                sublabel="need attention"
                tone={report.tasks.overdueCount === 0 ? 'success' : 'danger'}
                icon={report.tasks.overdueCount > 0 ? <Icons.AlertTriangle size="sm" /> : undefined}
              />
            </div>

            {/* Trend + habits */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
              <Card title="Completion trend" subtitle={report.period === 'week' ? 'Tasks completed per day' : 'Tasks completed per week'} className="lg:col-span-2">
                {report.tasks.completedInPeriod === 0 ? (
                  <div className="py-10 text-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                    No completions in this period yet.
                  </div>
                ) : (
                  <ChartComponent
                    data={report.tasks.trendCompletions}
                    labels={report.tasks.trendLabels}
                    color="var(--theme-accent)"
                    height={200}
                  />
                )}
              </Card>

              <Card
                title="Habit adherence"
                subtitle={report.habits.rows.length ? `${report.habits.maintainedCount} maintained · ${report.habits.atRiskCount} at risk · ${report.habits.overallAdherence}% overall` : undefined}
                className="lg:col-span-3"
              >
                {report.habits.rows.length === 0 ? (
                  <div className="py-8 text-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                    No habits tracked yet. Create habits to see how consistently you maintain them.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.habits.rows.map((row) => {
                      const meta = habitStatusMeta[row.status]
                      return (
                        <div key={row.habitId} className="rounded-xl p-3" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>{row.name}</p>
                              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                                {row.completed}/{row.expected} {row.frequency === 'weekly' ? 'weeks' : 'days'} · {row.currentStreak}-day streak
                              </p>
                            </div>
                            <span className={`badge ${meta.badge} flex-shrink-0`}>{row.adherence}% · {meta.label}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--theme-card-bg)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${row.adherence}%`, background: meta.bar }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Areas of concern */}
            <Card
              title="Areas of concern"
              subtitle="Overdue, completed-late, and stalled work that needs attention"
              icon={<Icons.AlertTriangle />}
            >
              {report.concerns.length === 0 ? (
                <div className="py-8 flex flex-col items-center text-center gap-2">
                  <span className="badge badge-success">All clear</span>
                  <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                    Nothing overdue or stalled — you&apos;re on top of your commitments.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleConcerns.map((concern) => {
                    const meta = severityMeta[concern.severity]
                    return (
                      <div
                        key={concern.id}
                        className="flex items-start gap-3 rounded-xl p-3"
                        style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
                      >
                        <div className="flex-shrink-0 mt-0.5" style={{ color: meta.color }}>
                          <Icons.AlertTriangle size="sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>{concern.title}</p>
                            <span className={`badge ${meta.badge} flex-shrink-0 capitalize`}>{concern.severity}</span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{concern.detail}</p>
                        </div>
                      </div>
                    )
                  })}
                  {concernOverflow > 0 && (
                    <p className="text-xs pt-1 text-center" style={{ color: 'var(--theme-text-muted)' }}>
                      + {concernOverflow} more — open Tasks to work through the rest.
                    </p>
                  )}
                </div>
              )}
            </Card>
          </>
        )}
      </PageContainer>
    </Layout>
  )
}
