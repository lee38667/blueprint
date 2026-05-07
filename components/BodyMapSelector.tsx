import { useMemo, useState } from 'react'
import Card from './Card'
import type { BodyPart } from '../types/models'

interface BodyMapSelectorProps {
  onLog: (payload: { bodyPart: BodyPart; reps?: number | null; sets?: number | null; notes?: string | null }) => Promise<unknown>
  progress: Record<BodyPart, { sessions: number; reps: number; sets: number }>
  unlockedAreas: BodyPart[]
  loading?: boolean
}

const ZONES: Array<{ bodyPart: BodyPart; label: string; x: number; y: number; width: number; height: number; rounded?: string }> = [
  { bodyPart: 'head', label: 'Head', x: 122, y: 26, width: 56, height: 56, rounded: '999' },
  { bodyPart: 'arms', label: 'Arms', x: 52, y: 106, width: 196, height: 72, rounded: '32' },
  { bodyPart: 'chest', label: 'Chest', x: 92, y: 106, width: 116, height: 78, rounded: '26' },
  { bodyPart: 'back', label: 'Back', x: 84, y: 188, width: 132, height: 54, rounded: '24' },
  { bodyPart: 'abs', label: 'Abs', x: 112, y: 190, width: 92, height: 92, rounded: '24' },
  { bodyPart: 'legs', label: 'Legs', x: 106, y: 284, width: 100, height: 154, rounded: '28' },
]

export default function BodyMapSelector({ onLog, progress, unlockedAreas, loading = false }: BodyMapSelectorProps) {
  const [selected, setSelected] = useState<BodyPart | null>(null)
  const [reps, setReps] = useState('12')
  const [sets, setSets] = useState('3')
  const [notes, setNotes] = useState('')

  const selectedProgress = selected ? progress[selected] : null
  const locked = useMemo(() => new Set<BodyPart>(['head', 'arms', 'chest', 'abs', 'legs', 'back'].filter((item) => !unlockedAreas.includes(item as BodyPart)) as BodyPart[]), [unlockedAreas])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected) return
    await onLog({
      bodyPart: selected,
      reps: reps ? parseInt(reps, 10) : null,
      sets: sets ? parseInt(sets, 10) : null,
      notes: notes || null,
    })
    setNotes('')
  }

  return (
    <Card title="Body Gate Map" subtitle="Tap a zone to forge a quick hunter workout.">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border p-4" style={{ borderColor: 'rgba(56, 189, 248, 0.14)', background: 'linear-gradient(180deg, rgba(8, 15, 33, 0.85), rgba(2, 6, 23, 0.94))' }}>
          <svg viewBox="0 0 300 470" className="mx-auto w-full max-w-[300px]" role="img" aria-label="Clickable body map">
            <defs>
              <linearGradient id="body-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.55)" />
                <stop offset="100%" stopColor="rgba(14, 165, 233, 0.08)" />
              </linearGradient>
            </defs>
            <path d="M150 68c-16 0-29 13-29 29v44l-60 18v39l39 14 6 58-12 118h28l18-86h20l18 86h28l-12-118 6-58 39-14v-39l-60-18V97c0-16-13-29-29-29Z" fill="url(#body-fill)" stroke="rgba(56, 189, 248, 0.18)" strokeWidth="2" />
            {ZONES.map((zone) => {
              const isLocked = locked.has(zone.bodyPart)
              const isSelected = selected === zone.bodyPart
              const zoneProgress = progress[zone.bodyPart]
              return (
                <g key={zone.bodyPart}>
                  <rect
                    x={zone.x}
                    y={zone.y}
                    width={zone.width}
                    height={zone.height}
                    rx={zone.rounded ?? '22'}
                    fill={isLocked ? 'rgba(51, 65, 85, 0.25)' : isSelected ? 'rgba(250, 204, 21, 0.28)' : 'rgba(56, 189, 248, 0.12)'}
                    stroke={isLocked ? 'rgba(100, 116, 139, 0.24)' : isSelected ? 'rgba(250, 204, 21, 0.85)' : 'rgba(56, 189, 248, 0.28)'}
                    strokeWidth="2"
                    style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                    onClick={() => !isLocked && setSelected(zone.bodyPart)}
                  />
                  <text x={zone.x + zone.width / 2} y={zone.y + zone.height / 2 - 6} textAnchor="middle" fill="rgba(226, 232, 240, 0.92)" fontSize="12" fontFamily="Space Grotesk, sans-serif">
                    {zone.label}
                  </text>
                  <text x={zone.x + zone.width / 2} y={zone.y + zone.height / 2 + 12} textAnchor="middle" fill="rgba(148, 163, 184, 0.92)" fontSize="10">
                    {isLocked ? 'Locked' : `${zoneProgress.sessions} runs`}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)' }}>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--theme-text-muted)' }}>Selected Zone</p>
            <h3 className="mt-2 text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>{selected ? selected[0].toUpperCase() + selected.slice(1) : 'Choose a body part'}</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--theme-text-dim)' }}>
              {selected
                ? 'Log one compact set and let the hunter system convert it into progression.'
                : 'Unlocked zones glow brighter as you train them.'}
            </p>
            {selectedProgress && selected && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="badge">{selectedProgress.sessions} sessions</span>
                <span className="badge">{selectedProgress.sets} sets</span>
                <span className="badge">{selectedProgress.reps} reps</span>
              </div>
            )}
          </div>

          <form onSubmit={submit} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: 'var(--theme-border)', background: 'rgba(15, 23, 42, 0.55)' }}>
            <div className="grid grid-cols-2 gap-3">
              <input value={sets} onChange={(event) => setSets(event.target.value)} className="input-base" placeholder="Sets" inputMode="numeric" />
              <input value={reps} onChange={(event) => setReps(event.target.value)} className="input-base" placeholder="Reps" inputMode="numeric" />
            </div>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="input-base w-full" placeholder="Hunter note: movement, load, or how the set felt." />
            <button type="submit" disabled={!selected || loading || locked.has(selected)} className="btn-accent w-full justify-center text-xs">
              {loading ? 'Forging...' : 'Log Body Quest'}
            </button>
          </form>
        </div>
      </div>
    </Card>
  )
}
