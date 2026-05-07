import { useEffect, useState } from 'react'
import { Modal } from './ModalEnhanced'

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { keys: ['Cmd', 'K'], description: 'Open global search' },
      { keys: ['Cmd', '/'], description: 'Open keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close modal/search' }
    ]
  },
  {
    category: 'Notes',
    items: [
      { keys: ['Cmd', 'N'], description: 'New note' },
      { keys: ['Cmd', 'S'], description: 'Save note' },
      { keys: ['Cmd', 'E'], description: 'Encrypt note' }
    ]
  },
  {
    category: 'Tasks',
    items: [
      { keys: ['Cmd', 'T'], description: 'New task' },
      { keys: ['Cmd', 'Enter'], description: 'Mark task complete' },
      { keys: ['Cmd', 'Shift', 'P'], description: 'Toggle priority' }
    ]
  },
  {
    category: 'Data Management',
    items: [
      { keys: ['Cmd', 'Shift', 'E'], description: 'Export to CSV' },
      { keys: ['Cmd', 'Shift', 'D'], description: 'Download backups' }
    ]
  }
]

export function KeyboardShortcutsGuide({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div className="space-y-6">
        {shortcuts.map((group) => (
          <div key={group.category}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--theme-accent)' }}>{group.category}</h3>
            <div className="space-y-2">
              {group.items.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 last:border-0"
                  style={{ borderBottom: '1px solid var(--theme-border)' }}
                >
                  <span className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <kbd
                          className="px-2 py-1 text-xs font-mono rounded"
                          style={{
                            background: 'var(--theme-surface)',
                            border: '1px solid var(--theme-border)',
                            color: 'var(--theme-text-dim)',
                          }}
                        >
                          {key}
                        </kbd>
                        {i < shortcut.keys.length - 1 && (
                          <span style={{ color: 'var(--theme-text-muted)' }}>+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
          <p className="text-caption">
            Note: Use{' '}
            <kbd className="px-1 text-xs rounded" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>Ctrl</kbd>
            {' '}instead of{' '}
            <kbd className="px-1 text-xs rounded" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>Cmd</kbd>
            {' '}on Windows/Linux
          </p>
        </div>
      </div>
    </Modal>
  )
}

// Hook to open shortcuts modal — with proper cleanup
export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  }
}
