import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Fuse from 'fuse.js'
import { useRouter } from 'next/router'

export default function VSCodeSearch({ onClose }: { onClose?: ()=>void }){
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const router = useRouter()

  const items = [
    { id: '/dashboard', title: 'Dashboard', type: 'Page' },
    { id: '/notes', title: 'Notes', type: 'Page' },
    { id: '/life-areas', title: 'Life Areas', type: 'Page' },
    { id: '/gym', title: 'Gym', type: 'Page' },
    { id: '/finance', title: 'Finance', type: 'Page' },
    { id: '/skills', title: 'Skills', type: 'Page' },
    { id: '/content', title: 'Content', type: 'Page' },
    { id: '/motivation', title: 'Motivation', type: 'Page' },
    { id: '/tasks', title: 'Tasks', type: 'Page' },
    { id: '/goals', title: 'Goals', type: 'Page' },
    { id: '/settings', title: 'Settings', type: 'Page' }
  ]

  useEffect(()=>{
    const fuse = new Fuse(items, { keys: ['title'] })
    if (!query) {
        setResults(items)
        return
    }
    const r = fuse.search(query).map(x=>x.item)
    setResults(r)
  }, [query])

  const handleSelect = (id: string) => {
    router.push(id)
    if(onClose) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-xl" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl panel-glass border border-white/10 rounded-2xl shadow-panel overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-3 items-center p-4 border-b border-white/5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-electric"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            autoFocus 
            value={query} 
            onChange={(e)=>setQuery(e.target.value)} 
            placeholder="Type a command or search..." 
            className="flex-1 bg-transparent text-white placeholder-neutral-500 outline-none font-sans text-lg" 
          />
          <div className="text-xs text-neutral-500 bg-white/5 px-2 py-1 rounded border border-white/5">ESC</div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
          {results.length === 0 && query && (
            <div className="p-4 text-center text-neutral-500">No results found.</div>
          )}
          {results.map((r, i) => (
            <motion.div 
              key={r.id} 
              onClick={() => handleSelect(r.id)}
              className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer group transition-colors"
              whileHover={{ x: 2 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-neutral-500 group-hover:text-electric transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                </span>
                <span className="font-medium">{r.title}</span>
              </div>
              <span className="text-xs text-neutral-600 group-hover:text-electric/70 uppercase tracking-wider">{r.type}</span>
            </motion.div>
          ))}
        </div>
        <div className="p-2 border-t border-white/5 bg-black/20 text-xs text-neutral-500 flex justify-between px-4">
          <span>Select</span>
          <span>↵ Enter</span>
        </div>
      </motion.div>
    </div>
  )
}
