// @ts-nocheck
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

export function Toast({ id, message, type, onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  const bgColor = {
    success: 'bg-green-900/30 border-green-800',
    error: 'bg-red-900/30 border-red-800',
    info: 'bg-blue-900/30 border-blue-800',
    warning: 'bg-yellow-900/30 border-yellow-800'
  }[type]

  const textColor = {
    success: 'text-green-300',
    error: 'text-red-300',
    info: 'text-blue-300',
    warning: 'text-yellow-300'
  }[type]

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  }[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: 20 }}
      transition={{ duration: 0.3 }}
      className={`${bgColor} border rounded-lg p-3 backdrop-blur-sm flex items-start gap-3 max-w-sm`}
    >
      <span className={`text-lg font-bold flex-shrink-0 ${textColor}`}>{icon}</span>
      <div className="flex-1">
        <p className={`text-sm ${textColor}`}>{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-neutral-400 hover:text-white flex-shrink-0 text-lg leading-none"
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
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onDismiss={() => onDismiss(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}
