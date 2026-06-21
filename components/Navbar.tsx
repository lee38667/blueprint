import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import VSCodeSearch from './VSCodeSearch'
import { KeyboardShortcutsGuide } from './KeyboardShortcuts'
import { useStore } from '../lib/store'
import { Icons } from './icons'
import { useNotifications } from '../hooks/useNotifications'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navbar() {
  const [openSearch, setOpenSearch] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const setMobileSidebarOpen = useStore((s) => s.setMobileSidebarOpen)
  const { pendingCount } = useNotifications()
  const router = useRouter()

  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
  }, [])

  const shortcutLabel = isMac ? '⌘K' : 'Ctrl+K'

  // Fetch user email
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setUserEmail(session.user.email)
      }
    }
    getUser()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrlK = e.ctrlKey && e.key.toLowerCase() === 'k'
      const isMetaK = e.metaKey && e.key.toLowerCase() === 'k'
      if (isCtrlK || isMetaK) {
        e.preventDefault()
        setOpenSearch(true)
      }
      if (e.key === 'Escape') {
        setOpenSearch(false)
        setShowShortcuts(false)
        setProfileOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  const handleLogout = async () => {
    setProfileOpen(false)
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-30 h-16 px-3 md:px-6 pt-2"
    >
      <div
        className="panel-glass flex items-center justify-between h-full px-3 md:px-5"
      >
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="btn-glow ring-soft hover-lift md:hidden"
            aria-label="Open menu"
          >
            <Icons.Menu style={{ color: 'var(--theme-text-dim)' }} />
          </button>
          {/* Desktop sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className="btn-glow ring-soft hover-lift hidden md:flex"
            aria-label="Toggle sidebar"
          >
            <Icons.Menu style={{ color: 'var(--theme-text-dim)' }} />
          </button>
          <button
            onClick={() => setOpenSearch(true)}
            className="group btn-glow ring-soft w-48 md:w-64 justify-start"
          >
            <Icons.Search size="sm" className="transition-colors" style={{ color: 'var(--theme-text-muted)' }} />
            <span className="text-sm hidden sm:inline" style={{ color: 'var(--theme-text-dim)' }}>Search...</span>
            <span
              className="ml-auto text-xs px-1.5 py-0.5 rounded hidden sm:inline"
              style={{
                background: 'var(--theme-input-bg)',
                border: '1px solid var(--theme-border)',
                color: 'var(--theme-text-muted)',
              }}
            >
              {shortcutLabel}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <button
            onClick={() => setShowShortcuts(true)}
            className="btn-glow ring-soft hover-lift hidden sm:flex"
            title={`Keyboard Shortcuts (${isMac ? '⌘' : 'Ctrl+'}/) `}
          >
            <Icons.Keyboard style={{ color: 'var(--theme-text-dim)' }} />
          </button>
          <Link
            href="/notifications"
            className="btn-glow ring-soft hover-lift relative"
            title="Notifications"
          >
            <Icons.Bell style={{ color: 'var(--theme-text-dim)' }} />
            {pendingCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                style={{ background: 'var(--color-error)' }}
              >
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </Link>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all"
              style={{
                background: profileOpen ? 'var(--theme-surface-hover)' : 'var(--theme-surface)',
                border: profileOpen ? '1px solid var(--theme-accent)' : '1px solid var(--theme-border)',
                color: 'var(--theme-text-dim)',
              }}
              aria-label="Profile menu"
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              <Icons.User />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden"
                  style={{
                    background: 'var(--theme-card-bg)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid var(--theme-border)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
                  }}
                  role="menu"
                >
                  {/* User info */}
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'var(--theme-surface)', color: 'var(--theme-accent)' }}
                      >
                        <Icons.User size="sm" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>
                          {userEmail || 'User'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Signed in</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: 'var(--theme-text-dim)' }}
                      role="menuitem"
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--theme-surface)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Icons.Settings size="sm" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors"
                      style={{ color: 'var(--color-error)' }}
                      role="menuitem"
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-error-surface)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Log out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {openSearch && <VSCodeSearch onClose={() => setOpenSearch(false)} />}
      {showShortcuts && (
        <KeyboardShortcutsGuide isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      )}
    </motion.header>
  )
}
