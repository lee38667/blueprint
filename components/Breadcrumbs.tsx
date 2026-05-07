import Link from 'next/link'
import { useRouter } from 'next/router'
import { Icons } from './icons'

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  tasks: 'Tasks',
  goals: 'Goals',
  notes: 'Notes',
  finance: 'Finance',
  gym: 'Gym',
  mental: 'Mental Health',
  habits: 'Habits',
  calendar: 'Calendar',
  chat: 'AI Chat',
  notifications: 'Notifications',
  settings: 'Settings',
  'life-areas': 'Life Areas',
  skills: 'Skills',
  content: 'Content',
  motivation: 'Motivation',
  scripture: 'Scripture',
}

export default function Breadcrumbs() {
  const router = useRouter()
  const segments = router.pathname.split('/').filter(Boolean)

  // Don't show breadcrumbs on dashboard (it's home)
  if (segments.length <= 1 && segments[0] === 'dashboard') return null
  if (segments.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-4 pt-2">
      <ol className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
        <li>
          <Link
            href="/dashboard"
            className="hover:underline transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Home
          </Link>
        </li>
        {segments.map((segment, index) => {
          const path = '/' + segments.slice(0, index + 1).join('/')
          const isLast = index === segments.length - 1
          const label = routeLabels[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

          return (
            <li key={path} className="flex items-center gap-1.5">
              <Icons.ChevronRight size="sm" style={{ color: 'var(--theme-text-muted)', opacity: 0.5 }} />
              {isLast ? (
                <span aria-current="page" style={{ color: 'var(--theme-text-dim)' }}>{label}</span>
              ) : (
                <Link
                  href={path}
                  className="hover:underline transition-colors"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
