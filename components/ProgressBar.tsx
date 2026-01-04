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
  color = 'electric'
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  
  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  }

  const colors = {
    electric: 'bg-electric',
    neon: 'bg-neon',
    teal: 'bg-teal-500',
    green: 'bg-green-500'
  }

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-neutral-400">{label}</span>}
          {showPercentage && (
            <span className="text-xs font-medium text-neutral-300">{percentage}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-black/40 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${colors[color as keyof typeof colors] || colors.electric} h-full transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {total > 0 && (
        <div className="mt-0.5 text-[10px] text-neutral-500">
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
