import Card from './Card'
import { Icons } from './icons'
import { CardSkeleton } from './Skeleton'
import { useDailyBriefing } from '../hooks/useDailyBriefing'

export default function DailyBriefingCard() {
  const { briefing, loading, error, refresh } = useDailyBriefing()

  if (!briefing && !loading && !error) return null

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Star size="sm" style={{ color: 'var(--theme-accent)' }} />
            <h3 className="font-display font-bold text-sm" style={{ color: 'var(--theme-text)' }}>
              {briefing?.greeting ?? 'Daily Briefing'}
            </h3>
          </div>
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--theme-surface-hover)]"
            style={{ color: 'var(--theme-text-muted)' }}
            title="Refresh briefing"
          >
            <Icons.Refresh size="sm" />
          </button>
        </div>

        {loading ? (
          <CardSkeleton className="h-24" />
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : briefing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority Tasks */}
            {briefing.priorityTasks.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                  Priority Today
                </p>
                <div className="space-y-1.5">
                  {briefing.priorityTasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: task.priority === 'high' ? '#f87171' : task.priority === 'normal' ? 'var(--theme-accent)' : '#14b8a6'
                        }}
                      />
                      <span style={{ color: 'var(--theme-text-dim)' }}>{task.title}</span>
                      {task.dueInfo && (
                        <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{task.dueInfo}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overdue Alerts */}
            {briefing.overdueAlerts.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide mb-2 text-red-400">Alerts</p>
                <div className="space-y-1">
                  {briefing.overdueAlerts.map((alert, idx) => (
                    <p key={idx} className="text-xs text-red-300">{alert}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Mood Trend */}
            <div>
              <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>Wellness</p>
              <p className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>{briefing.moodTrend}</p>
            </div>

            {/* Financial Note */}
            <div>
              <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>Finance</p>
              <p className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>{briefing.financialNote}</p>
            </div>

            {/* Focus Recommendation */}
            <div className="md:col-span-2 rounded-lg p-3" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
              <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--theme-accent)' }}>Focus</p>
              <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{briefing.focusRecommendation}</p>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
