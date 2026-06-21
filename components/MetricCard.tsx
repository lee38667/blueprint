import { ReactNode } from 'react'

export type MetricTone = 'default' | 'accent' | 'success' | 'warning' | 'danger'

interface MetricCardProps {
  label: string
  value: ReactNode
  sublabel?: ReactNode
  icon?: ReactNode
  tone?: MetricTone
  className?: string
}

const toneColor: Record<MetricTone, string> = {
  default: 'var(--theme-text)',
  accent: 'var(--theme-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-error)',
}

/**
 * Compact KPI tile used across analytics and dashboards. Keeps stat presentation
 * consistent: small uppercase label, large tabular value, optional sublabel.
 */
export default function MetricCard({ label, value, sublabel, icon, tone = 'default', className = '' }: MetricCardProps) {
  return (
    <div
      className={`panel-glass-subtle rounded-xl p-4 flex flex-col gap-1 ${className}`}
      style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
          {label}
        </span>
        {icon && <span style={{ color: toneColor[tone] }}>{icon}</span>}
      </div>
      <div className="text-2xl md:text-3xl font-display font-semibold tabular-nums leading-tight" style={{ color: toneColor[tone] }}>
        {value}
      </div>
      {sublabel && (
        <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          {sublabel}
        </div>
      )}
    </div>
  )
}
