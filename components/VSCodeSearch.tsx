import { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Fuse from 'fuse.js'
import { useRouter } from 'next/router'
import { useTasks } from '../hooks/useTasks'
import { useGoals } from '../hooks/useGoals'
import { useNotes } from '../hooks/useNotes'
import { useScriptureFavorites } from '../hooks/useScriptureFavorites'
import { Icons } from './icons'

interface SearchItem {
  id: string
  title: string
  subtitle?: string
  type: string
  href?: string
}

export default function VSCodeSearch({ onClose }: { onClose?: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [filter, setFilter] = useState<'all' | 'pages' | 'tasks' | 'goals' | 'notes' | 'scripture'>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { tasks } = useTasks()
  const { goals } = useGoals()
  const { notes } = useNotes()
  const { favorites } = useScriptureFavorites()

  const baseItems: SearchItem[] = [
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
    { id: '/mental', title: 'Mental Health', type: 'Page' },
    { id: '/notifications', title: 'Notifications', type: 'Page' },
    { id: '/settings', title: 'Settings', type: 'Page' }
  ]

  const dataset = useMemo(() => {
    const taskItems: SearchItem[] = tasks.map(t => ({
      id: `task-${t.id}`,
      title: t.title,
      subtitle: `${t.project ?? 'General'} • ${t.priority}`,
      type: 'Task',
      href: '/tasks'
    }))
    const goalItems: SearchItem[] = goals.map(g => ({
      id: `goal-${g.id}`,
      title: g.title,
      subtitle: g.category ?? 'Goal',
      type: 'Goal',
      href: '/goals'
    }))
    const noteItems: SearchItem[] = notes.map(n => ({
      id: `note-${n.id}`,
      title: n.title ?? 'Untitled Note',
      subtitle: n.content?.slice(0, 40) ?? '',
      type: 'Note',
      href: '/notes'
    }))
    const scriptureItems: SearchItem[] = favorites.map(f => ({
      id: `scripture-${f.id}`,
      title: f.reference,
      subtitle: f.verse.slice(0, 60),
      type: 'Scripture',
      href: '/dashboard'
    }))
    return [...baseItems, ...taskItems, ...goalItems, ...noteItems, ...scriptureItems]
  }, [tasks, goals, notes, favorites])

  useEffect(() => {
    const fuse = new Fuse(dataset, { keys: ['title', 'subtitle'], threshold: 0.3 })
    const filteredDataset = filter === 'all' ? dataset : dataset.filter(item => {
      const map: Record<string, string> = { pages: 'Page', tasks: 'Task', goals: 'Goal', notes: 'Note', scripture: 'Scripture' }
      return item.type === map[filter]
    })
    if (!query) {
      setResults(filteredDataset)
      return
    }
    const r = fuse.search(query).map(x => x.item).filter(item => filteredDataset.includes(item))
    setResults(r)
    setSelectedIndex(0)
  }, [query, dataset, filter])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        handleSelect(results[selectedIndex].id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [results, selectedIndex])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const handleSelect = (id: string) => {
    const target = results.find(r => r.id === id)
    router.push(target?.href ?? target?.id ?? id)
    if (onClose) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl panel-glass overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-3 items-center p-4" style={{ borderBottom: '1px solid var(--theme-border)' }}>
          <Icons.Search style={{ color: 'var(--theme-accent)' }} />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent outline-none font-sans text-lg"
            style={{ color: 'var(--theme-text)' }}
            aria-label="Search input"
          />
          <div
            className="text-xs px-2 py-1 rounded"
            style={{ color: 'var(--theme-text-muted)', background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
          >
            ESC
          </div>
        </div>
        <div className="flex gap-2 px-4 py-2 text-xs" style={{ borderBottom: '1px solid var(--theme-border)' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pages', label: 'Pages' },
            { key: 'tasks', label: 'Tasks' },
            { key: 'goals', label: 'Goals' },
            { key: 'notes', label: 'Notes' },
            { key: 'scripture', label: 'Scripture' }
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key as typeof filter)}
              className="px-3 py-1 rounded-full transition-colors"
              style={{
                border: filter === opt.key ? '1px solid var(--theme-accent)' : '1px solid var(--theme-border)',
                color: filter === opt.key ? 'var(--theme-accent)' : 'var(--theme-text-muted)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar" role="listbox">
          {results.length === 0 && query && (
            <div className="p-4 text-center" style={{ color: 'var(--theme-text-muted)' }}>No results found.</div>
          )}
          {results.map((r, i) => (
            <div
              key={r.id}
              onClick={() => handleSelect(r.id)}
              role="option"
              aria-selected={i === selectedIndex}
              className="flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-colors"
              style={{
                background: i === selectedIndex ? 'var(--theme-surface)' : 'transparent',
              }}
            >
              <div className="flex items-center gap-3">
                <span style={{ color: i === selectedIndex ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }} className="transition-colors">
                  <Icons.File size="sm" />
                </span>
                <div>
                  <div className="font-medium" style={{ color: 'var(--theme-text)' }}>{r.title}</div>
                  {r.subtitle && <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{r.subtitle}</div>}
                </div>
              </div>
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{r.type}</span>
            </div>
          ))}
        </div>
        <div className="p-2 px-4 flex justify-between text-xs" style={{ borderTop: '1px solid var(--theme-border)', background: 'var(--theme-surface)', color: 'var(--theme-text-muted)' }}>
          <span>Navigate with ↑↓ • Select with ↵</span>
          <span>ESC to close</span>
        </div>
      </motion.div>
    </div>
  )
}
