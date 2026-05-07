import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './icons';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Keyboard support + focus trap
  React.useEffect(() => {
    if (!isOpen) return;

    // Focus the dialog when opened
    dialogRef.current?.focus();

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onConfirm, onCancel]);

  const variantStyles = {
    danger: {
      confirmClass: 'btn-danger',
      iconColor: 'var(--color-error)',
      iconBg: 'var(--color-error-surface)',
      borderColor: 'var(--color-error-border)',
    },
    warning: {
      confirmClass: 'btn-accent',
      iconColor: 'var(--color-warning)',
      iconBg: 'var(--color-warning-surface)',
      borderColor: 'var(--color-warning-border)',
    },
    info: {
      confirmClass: 'btn-accent',
      iconColor: 'var(--color-info)',
      iconBg: 'var(--color-info-surface)',
      borderColor: 'var(--color-info-border)',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop z-50"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
          >
            <div
              ref={dialogRef}
              tabIndex={-1}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-message"
              className="modal-panel p-6"
              style={{ borderColor: styles.borderColor }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full"
                style={{ background: styles.iconBg }}
              >
                {variant === 'info' ? (
                  <Icons.Info style={{ color: styles.iconColor }} size="lg" />
                ) : (
                  <Icons.AlertTriangle style={{ color: styles.iconColor }} size="lg" />
                )}
              </div>

              {/* Title */}
              <h3 id="confirm-title" className="heading-md text-center mb-2">
                {title}
              </h3>

              {/* Message */}
              <p id="confirm-message" className="text-body text-center mb-6">{message}</p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="btn-secondary flex-1 justify-center"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`${styles.confirmClass} flex-1 justify-center`}
                >
                  {confirmText}
                </button>
              </div>

              {/* Keyboard hint */}
              <p className="text-caption text-center mt-4">
                Press <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>Enter</kbd> to
                confirm, <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>Esc</kbd> to
                cancel
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
