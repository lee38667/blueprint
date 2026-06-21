import { ReactNode } from 'react'

type BadgeVariant = 'default' | 'accent' | 'success' | 'error' | 'warning' | 'info'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    default: 'badge',
    accent: 'badge badge-accent',
    success: 'badge badge-success',
    error: 'badge badge-error',
    warning: 'badge badge-warning',
    info: 'badge badge-info',
  }

  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: '',
  }

  const dotColors: Record<BadgeVariant, string> = {
    default: 'var(--theme-text-muted)',
    accent: 'var(--theme-accent)',
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    warning: 'var(--color-warning)',
    info: 'var(--color-info)',
  }

  return (
    <span className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: dotColors[variant] }}
        />
      )}
      {children}
    </span>
  )
}
