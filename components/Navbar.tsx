import { useState } from 'react'
import VSCodeSearch from './VSCodeSearch'
import { useStore } from '../lib/store'

export default function Navbar(){
  const [openSearch, setOpenSearch] = useState(false)
  const toggleSidebar = useStore(s => s.toggleSidebar)

  return (
    <header className="sticky top-0 bg-black/40 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between z-20 h-16">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="text-minimal-gray hover:text-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <button 
          onClick={()=>setOpenSearch(true)} 
          className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-minimal-gray hover:bg-white/10 hover:border-electric/30 transition-all group w-64"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-electric transition-colors"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span className="text-sm">Search...</span>
          <span className="ml-auto text-xs bg-black/50 px-1.5 py-0.5 rounded text-gray-500 border border-white/5">⌘K</span>
        </button>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-sm font-medium text-white">Lee</div>
            <div className="text-xs text-electric">INTJ • Architect</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-minimal-gray">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
        </div>
      </div>
      {openSearch && <VSCodeSearch onClose={()=>setOpenSearch(false)} />}
    </header>
  )
}
