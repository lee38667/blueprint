import { ReactNode } from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
  noPadding?: boolean
}

export default function Card({ title, subtitle, icon, actions, children, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`panel-glass rounded-2xl flex flex-col ${noPadding ? '' : 'p-5 md:p-6'} ${className}`}>
      {(title || actions) && (
        <div className={`flex items-start justify-between gap-3 ${noPadding ? 'px-5 pt-5 md:px-6 md:pt-6' : ''} ${children ? 'mb-4' : ''}`}>
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="shrink-0" style={{ color: 'var(--theme-accent)' }}>
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-lg md:text-xl font-semibold tracking-tight" style={{ color: 'var(--theme-text)' }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={`text-sm leading-relaxed flex-1 ${noPadding ? 'px-5 pb-5 md:px-6 md:pb-6' : ''}`} style={{ color: 'var(--theme-text-dim)' }}>
        {children}
      </div>
    </div>
  )
}
