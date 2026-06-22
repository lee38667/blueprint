import { useMemo, useState } from 'react'
import Card from './Card'
import type { BodyPart } from '../types/models'

interface BodyMapSelectorProps {
  onLog: (payload: { bodyPart: BodyPart; reps?: number | null; sets?: number | null; notes?: string | null }) => Promise<unknown>
  progress: Record<BodyPart, { sessions: number; reps: number; sets: number }>
  unlockedAreas: BodyPart[]
  loading?: boolean
}

// Non-overlapping zones on a single stylized figure. Each rect's label sits at
// its own center so nothing collides (the previous layout overlapped arms↔chest
// and back↔abs). viewBox 0 0 300 470.
const ZONES: Array<{ bodyPart: BodyPart; label: string; x: number; y: number; width: number; height: number; rx: number }> = [
  { bodyPart: 'head', label: 'Head', x: 126, y: 22, width: 48, height: 48, rx: 24 },
  { bodyPart: 'back', label: 'Back', x: 104, y: 78, width: 92, height: 24, rx: 12 },
  { bodyPart: 'arms', label: 'Arms', x: 64, y: 110, width: 30, height: 100, rx: 15 },
  { bodyPart: 'chest', label: 'Chest', x: 110, y: 110, width: 80, height: 46, rx: 16 },
  { bodyPart: 'abs', label: 'Abs', x: 114, y: 162, width: 72, height: 70, rx: 16 },
  { bodyPart: 'legs', label: 'Legs', x: 110, y: 240, width: 80, height: 150, rx: 20 },
]
// Mirror the arms zone on the right side (same bodyPart, decorative twin).
const ARM_TWIN = { x: 206, y: 110, width: 30, height: 100, rx: 15 }

export default function BodyMapSelector({ onLog, progress, unlockedAreas, loading = false }: BodyMapSelectorProps) {
  const [selected, setSelected] = useState<BodyPart | null>(null)
  const [hovered, setHovered] = useState<BodyPart | null>(null)
  const [reps, setReps] = useState('12')
  const [sets, setSets] = useState('3')
  const [notes, setNotes] = useState('')

  const selectedProgress = selected ? progress[selected] : null
  const locked = useMemo(
    () => new Set<BodyPart>((['head', 'arms', 'chest', 'abs', 'legs', 'back'] as BodyPart[]).filter((item) => !unlockedAreas.includes(item))),
    [unlockedAreas]
  )

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

  const fillFor = (zone: BodyPart, isLocked: boolean, isSelected: boolean, isHover: boolean) => {
    if (isLocked) return 'color-mix(in srgb, var(--theme-text-muted) 18%, transparent)'
    if (isSelected) return 'color-mix(in srgb, var(--theme-accent) 38%, transparent)'
    if (isHover) return 'color-mix(in srgb, var(--theme-accent) 24%, transparent)'
    return 'color-mix(in srgb, var(--theme-accent) 13%, transparent)'
  }
  const strokeFor = (isLocked: boolean, isSelected: boolean) =>
    isLocked
      ? 'color-mix(in srgb, var(--theme-text-muted) 35%, transparent)'
      : isSelected
        ? 'var(--theme-accent)'
        : 'color-mix(in srgb, var(--theme-accent) 45%, transparent)'

  return (
    <Card title="Body Gate Map" subtitle="Tap a zone to forge a quick body quest.">
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div
          className="rounded-[28px] p-4"
          style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}
        >
          <svg viewBox="0 0 300 470" className="mx-auto w-full max-w-[300px]" role="img" aria-label="Clickable body map">
            {/* faint connective silhouette */}
            <g fill="color-mix(in srgb, var(--theme-text) 5%, transparent)" stroke="var(--theme-border)" strokeWidth="1.5">
              <rect x="118" y="96" width="64" height="160" rx="26" />
              <rect x="120" y="232" width="60" height="170" rx="24" />
            </g>

            {ZONES.map((zone) => {
              const isLocked = locked.has(zone.bodyPart)
              const isSelected = selected === zone.bodyPart
              const isHover = hovered === zone.bodyPart
              const zp = progress[zone.bodyPart]
              const rects = zone.bodyPart === 'arms' ? [zone, { ...zone, ...ARM_TWIN }] : [zone]
              return (
                <g
                  key={zone.bodyPart}
                  style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={() => setHovered(zone.bodyPart)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => !isLocked && setSelected(isSelected ? null : zone.bodyPart)}
                  role="button"
                  aria-label={`${zone.label}${isLocked ? ' (locked)' : `: ${zp.sessions} sessions`}`}
                >
                  {rects.map((r, i) => (
                    <rect
                      key={i}
                      x={r.x}
                      y={r.y}
                      width={r.width}
                      height={r.height}
                      rx={r.rx}
                      fill={fillFor(zone.bodyPart, isLocked, isSelected, isHover)}
                      stroke={strokeFor(isLocked, isSelected)}
                      strokeWidth="2"
                    />
                  ))}
                  {/* label only on the primary rect */}
                  <text
                    x={zone.x + zone.width / 2}
                    y={zone.y + zone.height / 2 - 4}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="var(--theme-text)"
                  >
                    {zone.label}
                  </text>
                  <text
                    x={zone.x + zone.width / 2}
                    y={zone.y + zone.height / 2 + 12}
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--theme-text-muted)"
                  >
                    {isLocked ? 'Locked' : `${zp.sessions} runs`}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}>
            <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--theme-text-muted)' }}>Selected Zone</p>
            <h3 className="mt-2 text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
              {selected ? selected[0].toUpperCase() + selected.slice(1) : 'Choose a body part'}
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--theme-text-dim)' }}>
              {selected
                ? 'Log one compact set and the system turns it into progression.'
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

          <form onSubmit={submit} className="space-y-3 rounded-2xl p-4" style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-input-bg)' }}>
            <div className="grid grid-cols-2 gap-3">
              <input value={sets} onChange={(event) => setSets(event.target.value)} className="input-base" placeholder="Sets" inputMode="numeric" aria-label="Sets" />
              <input value={reps} onChange={(event) => setReps(event.target.value)} className="input-base" placeholder="Reps" inputMode="numeric" aria-label="Reps" />
            </div>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="input-base w-full" placeholder="Note: movement, load, or how the set felt." />
            <button type="submit" disabled={!selected || loading || (selected ? locked.has(selected) : false)} className="btn-accent w-full justify-center text-xs">
              {loading ? 'Logging…' : 'Log Body Quest'}
            </button>
          </form>
        </div>
      </div>
    </Card>
  )
}
