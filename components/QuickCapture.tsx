import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useTasks } from '../hooks/useTasks'

// Fast daily capture — the <10s primitive. The text input logs a task instantly;
// the chips deep-link to the matching feature for richer capture. Fully theme-aware
// (Aozora / Grace) via --theme-* tokens; entrance animation via .fx-rise.
const CHIPS: Array<{ label: string; href: string; path: ReactNode }> = [
  { label: 'Mood', href: '/mental', path: <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" /> },
  { label: 'Note', href: '/notes', path: <path d="M4 7h16M4 12h16M4 17h10" /> },
  { label: 'Habit', href: '/habits', path: <path d="M9 11l3 3 8-8M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11" /> },
  { label: 'Photo', href: '/motivation', path: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></> },
]

export default function QuickCapture() {
  const { addTask } = useTasks()
  const router = useRouter()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = value.trim()
    if (!title || busy) return
    setBusy(true)
    try {
      await addTask({ title })
      setValue('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      aria-label="Quick capture"
      className="fx-rise relative overflow-hidden rounded-2xl p-3 sm:p-4"
      style={{
        background: 'var(--theme-card-bg)',
        border: '1px solid var(--theme-border)',
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <span
        aria-hidden
        className="absolute top-0 left-[8%] right-[8%] h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--theme-accent), transparent)', opacity: 0.7 }}
      />
      <form onSubmit={submit} className="flex items-center gap-2 sm:gap-3">
        <span
          aria-hidden
          className="hidden sm:grid place-items-center shrink-0 rounded-xl"
          style={{ width: 42, height: 42, background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.1}>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <label htmlFor="quick-capture-input" className="sr-only">Capture a task or thought</label>
        <input
          id="quick-capture-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Capture a task or thought…  (press Enter to log)"
          className="flex-1 bg-transparent text-base outline-none"
          style={{ color: 'var(--theme-text)' }}
          autoComplete="off"
        />
        <button type="submit" className="btn-accent shrink-0" disabled={busy || !value.trim()}>
          {busy ? 'Logging…' : 'Log it'}
        </button>
      </form>
      <div className="flex flex-wrap gap-2 mt-3">
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => router.push(chip.href)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-dim)' }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2}>
              {chip.path}
            </svg>
            {chip.label}
          </button>
        ))}
      </div>
    </section>
  )
}
