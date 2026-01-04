import { useState } from 'react'
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
      title="⌨️ Keyboard Shortcuts"
      size="lg"
    >
      <div className="space-y-6">
        {shortcuts.map((group) => (
          <div key={group.category}>
            <h3 className="text-sm font-semibold text-electric mb-3">{group.category}</h3>
            <div className="space-y-2">
              {group.items.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-neutral-300 text-sm">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <kbd className="px-2 py-1 text-xs font-mono bg-black/40 border border-white/10 rounded">
                          {key}
                        </kbd>
                        {i < shortcut.keys.length - 1 && (
                          <span className="text-neutral-500">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-neutral-500">
            Note: Use <kbd className="px-1 text-xs bg-black/40 border border-white/10 rounded">Ctrl</kbd> instead of{' '}
            <kbd className="px-1 text-xs bg-black/40 border border-white/10 rounded">Cmd</kbd> on Windows/Linux
          </p>
        </div>
      </div>
    </Modal>
  )
}

// Hook to open shortcuts modal
export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)

  // Listen for Cmd+/ to open shortcuts
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setIsOpen(true)
      }
    })
  }

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  }
}
