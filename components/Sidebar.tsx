import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../lib/store'
import { useRouter } from 'next/router'
import { Icons } from './icons'
import { useEffect } from 'react'

const NavItem = ({ href, label, Icon, collapsed, onClick }: { href: string; label: string; Icon: React.ComponentType<any>; collapsed: boolean; onClick?: () => void }) => {
  const router = useRouter()
  const isActive = router.pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`hover-lift flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group ${
        isActive
          ? 'ring-1 bg-[var(--theme-surface-hover)]'
          : 'hover:bg-[var(--theme-surface)]'
      }`}
      style={{
        boxShadow: isActive ? 'inset 0 0 0 1px var(--theme-accent)' : undefined,
      }}
    >
      <div
        className="transition-colors flex-shrink-0"
        style={{ color: isActive ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }}
      >
        <Icon />
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.2 }}
            className="font-medium tracking-wide text-sm whitespace-nowrap"
            style={{ color: isActive ? 'var(--theme-text)' : 'var(--theme-text-dim)' }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}

const NavGroup = ({ label, collapsed, children }: { label: string; collapsed: boolean; children: React.ReactNode }) => {
  return (
    <div className="space-y-0.5">
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="px-3 pt-4 pb-1"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>
              {label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {collapsed && <div className="pt-3" />}
      {children}
    </div>
  )
}

interface NavSection {
  label: string
  items: Array<{ href: string; label: string; Icon: React.ComponentType<any> }>
}

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', Icon: Icons.Dashboard },
      { href: '/motivation', label: 'Motivation', Icon: Icons.Star },
      { href: '/notifications', label: 'Notifications', Icon: Icons.Bell },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { href: '/tasks', label: 'Tasks', Icon: Icons.Check },
      { href: '/goals', label: 'Goals', Icon: Icons.Target },
      { href: '/habits', label: 'Habits', Icon: Icons.Habit },
      { href: '/analytics', label: 'Analytics', Icon: Icons.Analytics },
      { href: '/calendar', label: 'Calendar', Icon: Icons.Calendar },
    ],
  },
  {
    label: 'Wellness',
    items: [
      { href: '/gym', label: 'Gym', Icon: Icons.Gym },
      { href: '/mental', label: 'Mental Health', Icon: Icons.Brain },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      { href: '/notes', label: 'Notes', Icon: Icons.Notes },
      { href: '/content', label: 'Content', Icon: Icons.Content },
      { href: '/skills', label: 'Skills', Icon: Icons.Skills },
    ],
  },
  {
    label: 'Life',
    items: [
      { href: '/finance', label: 'Finance', Icon: Icons.Finance },
      { href: '/life-areas', label: 'Life Areas', Icon: Icons.Globe },
      { href: '/chat', label: 'AI Chat', Icon: Icons.Chat },
    ],
  },
]

export default function Sidebar() {
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const mobileSidebarOpen = useStore((s) => s.mobileSidebarOpen)
  const setMobileSidebarOpen = useStore((s) => s.setMobileSidebarOpen)
  const router = useRouter()

  // Close mobile sidebar on route change
  useEffect(() => {
    const handleRouteChange = () => setMobileSidebarOpen(false)
    router.events.on('routeChangeStart', handleRouteChange)
    return () => router.events.off('routeChangeStart', handleRouteChange)
  }, [router.events, setMobileSidebarOpen])

  // Close mobile sidebar on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileSidebarOpen) {
        setMobileSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mobileSidebarOpen, setMobileSidebarOpen])

  const closeMobile = () => setMobileSidebarOpen(false)

  const sidebarContent = (isMobile: boolean) => (
    <aside
      className={`h-screen p-3 flex flex-col transition-all duration-300 ${
        isMobile ? 'w-72' : collapsed ? 'w-20' : 'w-72'
      }`}
      style={{
        background: 'var(--theme-sidebar-bg)',
        borderRight: '1px solid var(--theme-border)',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className={`mb-6 flex items-center ${collapsed && !isMobile ? 'justify-center' : 'px-2'}`}>
        <div className="relative w-9 h-9 rounded-xl overflow-hidden border flex-shrink-0" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)' }}>
          <Image src="/logo.png" alt="Blueprint logo" fill className="object-contain" priority />
        </div>
        <AnimatePresence initial={false}>
          {(!collapsed || isMobile) && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
              className="ml-3 text-lg font-display tracking-wide"
              style={{ color: 'var(--theme-text)' }}
            >
              Blueprint
            </motion.span>
          )}
        </AnimatePresence>
        {isMobile && (
          <button
            onClick={closeMobile}
            className="ml-auto p-2 rounded-lg transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
            aria-label="Close sidebar"
          >
            <Icons.X />
          </button>
        )}
      </div>

      <nav className="space-y-0.5 flex-1 overflow-y-auto no-scrollbar">
        {navSections.map((section) => (
          <NavGroup key={section.label} label={section.label} collapsed={collapsed && !isMobile}>
            {section.items.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                collapsed={collapsed && !isMobile}
                onClick={isMobile ? closeMobile : undefined}
              />
            ))}
          </NavGroup>
        ))}
      </nav>

      <div className="pt-3" style={{ borderTop: '1px solid var(--theme-border)' }}>
        <NavItem
          href="/settings"
          label="Settings"
          Icon={Icons.Settings}
          collapsed={collapsed && !isMobile}
          onClick={isMobile ? closeMobile : undefined}
        />
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block flex-shrink-0">
        {sidebarContent(false)}
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sidebar-overlay md:hidden"
              onClick={closeMobile}
            />
            <motion.div
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="fixed left-0 top-0 z-50 md:hidden"
            >
              {sidebarContent(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
