import { calculateTrend, formatTrendDisplay, TrendData } from '@/lib/chartUtils'

interface TrendIndicatorProps {
  data: number[]
  periodDays?: number
  threshold?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function TrendIndicator({ 
  data, 
  periodDays = 7, 
  threshold = 5,
  label,
  size = 'md'
}: TrendIndicatorProps) {
  const trend = calculateTrend(data, periodDays, threshold)
  
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg bg-[var(--theme-surface)] ${sizes[size]} border border-[var(--theme-border)]`}>
      <span className="text-lg leading-none">{trend.icon}</span>
      <div className="flex flex-col">
        {label && <span className="text-[10px] text-neutral-500 leading-tight">{label}</span>}
        <span 
          className="font-semibold leading-tight"
          style={{ color: trend.color }}
        >
          {trend.percentage >= 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// Standalone function component for simple use
export function TrendBadge({ trend }: { trend: TrendData }) {
  return (
    <span 
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-[var(--theme-surface)] border border-[var(--theme-border)]"
      style={{ color: trend.color }}
    >
      <span>{trend.icon}</span>
      <span>{trend.percentage >= 0 ? '+' : ''}{trend.percentage.toFixed(1)}%</span>
    </span>
  )
}
