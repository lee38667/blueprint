import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import VSCodeSearch from './VSCodeSearch'
import { useStore } from '../lib/store'

export default function Navbar(){
  const [openSearch, setOpenSearch] = useState(false)
  const toggleSidebar = useStore(s => s.toggleSidebar)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+K on Windows/Linux, Meta+K on macOS
      const isCtrlK = e.ctrlKey && e.key.toLowerCase() === 'k'
      const isMetaK = e.metaKey && e.key.toLowerCase() === 'k'
      if (isCtrlK || isMetaK) {
        e.preventDefault()
        setOpenSearch(true)
      }
      if (e.key === 'Escape') {
        setOpenSearch(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-30 h-16 px-4 md:px-8"
    >
      <div className="panel-glass flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="btn-glow ring-soft hover-lift">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <button
            onClick={() => setOpenSearch(true)}
            className="group btn-glow ring-soft w-64 justify-start"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400 group-hover:text-electric transition-colors"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span className="text-sm text-neutral-300">Search…</span>
            <span className="ml-auto text-xs bg-black/40 px-1.5 py-0.5 rounded text-neutral-400 border border-white/10">⌘K</span>
          </button>
        </div>

        <div className="flex items-center gap-6">
          <motion.div whileHover={{ scale: 1.04 }} className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center text-neutral-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </motion.div>
        </div>
      </div>

      {openSearch && <VSCodeSearch onClose={() => setOpenSearch(false)} />}
    </motion.header>
  )
}
