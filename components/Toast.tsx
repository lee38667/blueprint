import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  id: string
  message: string
  type: ToastType
  onDismiss: () => void
  duration?: number
}

const toastConfig: Record<ToastType, { icon: string; surface: string; border: string; text: string }> = {
  success: {
    icon: '✓',
    surface: 'var(--color-success-surface)',
    border: 'var(--color-success-border)',
    text: 'var(--color-success)',
  },
  error: {
    icon: '✕',
    surface: 'var(--color-error-surface)',
    border: 'var(--color-error-border)',
    text: 'var(--color-error)',
  },
  info: {
    icon: 'ℹ',
    surface: 'var(--color-info-surface)',
    border: 'var(--color-info-border)',
    text: 'var(--color-info)',
  },
  warning: {
    icon: '⚠',
    surface: 'var(--color-warning-surface)',
    border: 'var(--color-warning-border)',
    text: 'var(--color-warning)',
  },
}

export function Toast({ id, message, type, onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  const config = toastConfig[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: 20 }}
      transition={{ duration: 0.3 }}
      role="status"
      aria-live="polite"
      className="rounded-lg p-3 backdrop-blur-sm flex items-start gap-3 max-w-sm"
      style={{
        background: config.surface,
        border: `1px solid ${config.border}`,
      }}
    >
      <span className="text-lg font-bold shrink-0" style={{ color: config.text }}>{config.icon}</span>
      <div className="flex-1">
        <p className="text-sm" style={{ color: config.text }}>{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-lg leading-none transition-colors"
        style={{ color: 'var(--theme-text-muted)' }}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: Array<ToastProps & { id: string }>
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2" aria-label="Notifications">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onDismiss={() => onDismiss(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}
