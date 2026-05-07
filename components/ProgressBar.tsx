interface ProgressBarProps {
  current: number
  total: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export default function ProgressBar({
  current,
  total,
  label,
  showPercentage = true,
  size = 'md',
  color = 'accent'
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorStyles: Record<string, string> = {
    accent: 'var(--theme-accent)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
    info: 'var(--color-info)',
    electric: '#00E5FF',
    neon: '#B300FF',
    teal: '#00FFCC',
    green: '#22c55e',
  }

  const barColor = colorStyles[color] || colorStyles.accent

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-caption">{label}</span>}
          {showPercentage && (
            <span className="text-xs font-medium" style={{ color: 'var(--theme-text-dim)' }}>{percentage}%</span>
          )}
        </div>
      )}
      <div
        className={`w-full rounded-full overflow-hidden ${heights[size]}`}
        style={{ background: 'var(--theme-surface)' }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `${percentage}% complete`}
      >
        <div
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%`, background: barColor }}
        />
      </div>
      {total > 0 && (
        <div className="mt-0.5 text-caption">
          {current} of {total} complete
        </div>
      )}
    </div>
  )
}

// Helper to calculate goal progress
export function calculateGoalProgress(milestones: any[]): { current: number; total: number } {
  const total = milestones.length
  const current = milestones.filter(m => m.status === 'done').length
  return { current, total }
}

// Helper to calculate milestone progress
export function calculateMilestoneProgress(subtasks: any[]): { current: number; total: number } {
  const total = subtasks.length
  const current = subtasks.filter(s => s.status === 'done').length
  return { current, total }
}
