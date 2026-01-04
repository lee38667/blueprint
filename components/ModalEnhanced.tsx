// @ts-nocheck
import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ isOpen, onClose, title, children, actions, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden`}
            >
              {/* Header */}
              <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-electric">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-neutral-400 hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 text-neutral-300 max-h-[60vh] overflow-y-auto">
                {children}
              </div>

              {/* Actions */}
              {actions && (
                <div className="border-t border-white/10 px-6 py-4 flex items-center justify-end gap-3">
                  {actions}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// Confirmation Dialog Helper Component
interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  confirmVariant?: 'primary' | 'danger'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  isLoading = false
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    if (!isLoading) onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      actions={
        <>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-white/10 text-neutral-300 hover:border-white/30 hover:text-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
              confirmVariant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-electric text-black hover:bg-electric/90'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <p className="text-neutral-300">{message}</p>
    </Modal>
  )
}
