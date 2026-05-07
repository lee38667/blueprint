import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import AuthGuard from './AuthGuard'
import Breadcrumbs from './Breadcrumbs'

interface LayoutProps {
  children: ReactNode
  className?: string
}

export default function Layout({ children, className = '' }: LayoutProps) {
  return (
    <AuthGuard>
      {/* Skip to main content — accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <div className="min-h-screen flex font-sans" style={{ color: 'var(--theme-text)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          <Navbar />
          <main
            id="main-content"
            className={`flex-1 overflow-y-auto px-4 md:px-8 pb-8 ${className}`}
            role="main"
          >
            <Breadcrumbs />
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
