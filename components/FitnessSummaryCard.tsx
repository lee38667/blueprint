import Card from './Card'
import Button from './Button'
import { useFitness } from '../hooks/useFitness'

/**
 * Dashboard card showing the latest Google Fit / Galaxy Watch metrics with a
 * manual "Sync now" button. Prompts to connect when there's no link yet.
 */
export default function FitnessSummaryCard() {
  const { connected, latest, loading, syncing, error, connect, sync } = useFitness()

  const metrics: Array<{ label: string; value: string }> = latest
    ? [
        { label: 'Steps', value: latest.steps != null ? latest.steps.toLocaleString() : '—' },
        { label: 'Sleep', value: latest.sleep_min != null ? `${Math.floor(latest.sleep_min / 60)}h ${latest.sleep_min % 60}m` : '—' },
        { label: 'Resting HR', value: latest.resting_hr != null ? `${latest.resting_hr} bpm` : '—' },
        { label: 'Weight', value: latest.weight_kg != null ? `${latest.weight_kg} kg` : '—' },
      ]
    : []

  return (
    <Card title="Wearable (Google Fit)" subtitle="Steps, sleep & heart rate from your Galaxy Watch.">
      {loading ? (
        <div className="h-24 flex items-center justify-center subtle-muted text-sm">Loading…</div>
      ) : !connected ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Connect Google Fit to pull your watch&apos;s steps, sleep and heart rate.
          </p>
          <Button variant="primary" size="sm" onClick={connect}>Connect Google Fit</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-xl p-3" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{m.label}</div>
                <div className="text-lg font-semibold mt-1" style={{ color: 'var(--theme-text)' }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" loading={syncing} onClick={() => sync(7)}>Sync now</Button>
            <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {latest ? `Latest: ${new Date(latest.day).toLocaleDateString()}` : 'No data yet — try syncing.'}
            </span>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </Card>
  )
}
