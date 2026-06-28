import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Breadcrumbs from './Breadcrumbs'
import AmbientBackdrop from './AmbientBackdrop'

interface LayoutProps {
  children: ReactNode
  className?: string
}

// Authentication is enforced globally in pages/_app.tsx; Layout no longer
// re-gates (previously double-gated via AuthGuard, causing a redundant
// session check and a second loading flash).
export default function Layout({ children, className = '' }: LayoutProps) {
  return (
    <>
      {/* Skip to main content — accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <AmbientBackdrop />

      <div className="min-h-screen flex font-sans relative z-[1]" style={{ color: 'var(--theme-text)' }}>
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
    </>
  )
}
