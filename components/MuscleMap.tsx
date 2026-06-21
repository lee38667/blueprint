import { useState } from 'react'
import {
  MUSCLES,
  STATUS_META,
  type MuscleKey,
  type MuscleStatus,
} from '../lib/muscles'

interface MuscleMapProps {
  /** Recovery status per muscle, drives fill color. */
  statusByMuscle: Record<MuscleKey, MuscleStatus>
  /** Effective weekly sets per muscle, shown on hover. */
  setsByMuscle: Record<MuscleKey, number>
  selected: MuscleKey | null
  onSelect: (key: MuscleKey | null) => void
}

interface Shape {
  key: MuscleKey
  /** Ellipse params: [cx, cy, rx, ry, rotateDeg?] */
  ellipses: Array<[number, number, number, number, number?]>
}

// Anterior figure centered ~x=90; posterior figure centered ~x=270.
const FRONT: Shape[] = [
  { key: 'front_delts', ellipses: [[66, 62, 11, 10], [114, 62, 11, 10]] },
  { key: 'chest', ellipses: [[78, 75, 13, 11], [102, 75, 13, 11]] },
  { key: 'biceps', ellipses: [[57, 97, 8, 16, -8], [123, 97, 8, 16, 8]] },
  { key: 'forearms', ellipses: [[49, 130, 7, 17, -6], [131, 130, 7, 17, 6]] },
  { key: 'abs', ellipses: [[90, 110, 12, 24]] },
  { key: 'obliques', ellipses: [[74, 112, 5, 17], [106, 112, 5, 17]] },
  { key: 'quads', ellipses: [[80, 182, 12, 35], [100, 182, 12, 35]] },
  { key: 'calves', ellipses: [[80, 252, 9, 26], [100, 252, 9, 26]] },
]

const BACK: Shape[] = [
  { key: 'traps', ellipses: [[270, 62, 21, 14]] },
  { key: 'rear_delts', ellipses: [[246, 66, 11, 10], [294, 66, 11, 10]] },
  { key: 'lats', ellipses: [[256, 94, 13, 21, 6], [284, 94, 13, 21, -6]] },
  { key: 'triceps', ellipses: [[237, 99, 8, 17, -8], [303, 99, 8, 17, 8]] },
  { key: 'lower_back', ellipses: [[270, 122, 13, 14]] },
  { key: 'glutes', ellipses: [[260, 152, 13, 15], [280, 152, 13, 15]] },
  { key: 'hamstrings', ellipses: [[260, 192, 12, 32], [280, 192, 12, 32]] },
  { key: 'calves', ellipses: [[260, 252, 9, 26], [280, 252, 9, 26]] },
]

// Faint body silhouette so the muscle blobs read as a figure.
const SILHOUETTE =
  'M0 -34 a16 16 0 1 0 0.01 0 Z M-7 -16 q7 -4 14 0 l16 8 q6 3 7 10 l3 24 q1 6 -5 6 q-5 0 -6 -5 l-3 -18 -2 40 4 46 q1 7 -6 7 q-6 0 -7 -6 l-5 -40 -5 40 q-1 6 -7 6 q-7 0 -6 -7 l4 -46 -2 -40 -3 18 q-1 5 -6 5 q-6 0 -5 -6 l3 -24 q1 -7 7 -10 Z'

export default function MuscleMap({ statusByMuscle, setsByMuscle, selected, onSelect }: MuscleMapProps) {
  const [hovered, setHovered] = useState<MuscleKey | null>(null)
  const active = hovered ?? selected

  const renderShape = (shape: Shape) => {
    const status = statusByMuscle[shape.key] ?? 'untrained'
    const isActive = active === shape.key
    const fill = STATUS_META[status].color
    return (
      <g
        key={`${shape.key}-${shape.ellipses[0][0]}`}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHovered(shape.key)}
        onMouseLeave={() => setHovered(null)}
        onClick={() => onSelect(selected === shape.key ? null : shape.key)}
        role="button"
        aria-label={`${MUSCLES[shape.key].label}: ${STATUS_META[status].label}`}
      >
        {shape.ellipses.map(([cx, cy, rx, ry, rot], i) => (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}
            fill={fill}
            fillOpacity={isActive ? 0.95 : 0.78}
            stroke={isActive ? 'var(--theme-text)' : 'rgba(255,255,255,0.25)'}
            strokeWidth={isActive ? 2 : 1}
          />
        ))}
      </g>
    )
  }

  return (
    <div className="w-full">
      <svg viewBox="0 0 360 300" className="w-full max-w-[460px] mx-auto" role="img" aria-label="Interactive muscle map">
        {/* Figure silhouettes + heads */}
        <g transform="translate(90 70)" fill="var(--theme-surface)" stroke="var(--theme-border)" strokeWidth="1.5">
          <path d={SILHOUETTE} />
        </g>
        <g transform="translate(270 70)" fill="var(--theme-surface)" stroke="var(--theme-border)" strokeWidth="1.5">
          <path d={SILHOUETTE} />
        </g>

        {FRONT.map(renderShape)}
        {BACK.map(renderShape)}

        {/* View labels */}
        <text x="90" y="296" textAnchor="middle" fontSize="11" fill="var(--theme-text-muted)" fontFamily="inherit">
          Front
        </text>
        <text x="270" y="296" textAnchor="middle" fontSize="11" fill="var(--theme-text-muted)" fontFamily="inherit">
          Back
        </text>
      </svg>

      {/* Hover / selection detail */}
      <div className="mt-2 min-h-[42px] text-center">
        {active ? (
          <div>
            <span className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
              {MUSCLES[active].label}
            </span>
            <span
              className="ml-2 text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: STATUS_META[statusByMuscle[active] ?? 'untrained'].color, color: '#0a0a0a' }}
            >
              {STATUS_META[statusByMuscle[active] ?? 'untrained'].label}
            </span>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              {Math.round((setsByMuscle[active] ?? 0) * 10) / 10} sets / 7d · target {MUSCLES[active].weeklySetTarget} ·{' '}
              {STATUS_META[statusByMuscle[active] ?? 'untrained'].hint}
            </p>
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            Hover or tap a muscle to see recovery status and weekly volume.
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {(['recovered', 'recovering', 'fatigued', 'untrained'] as MuscleStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: STATUS_META[s].color }} />
            <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
              {STATUS_META[s].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
