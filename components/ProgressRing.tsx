interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  subtitle?: string
  color?: string
}

export default function ProgressRing({
  value,
  size = 96,
  strokeWidth = 10,
  label,
  subtitle,
  color = 'var(--theme-accent)'
}: ProgressRingProps) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (normalized / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="color-mix(in srgb, var(--theme-border) 80%, transparent)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <span className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>{normalized}%</span>
        {label && <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{label}</span>}
        {subtitle && <span className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>{subtitle}</span>}
      </div>
    </div>
  )
}
