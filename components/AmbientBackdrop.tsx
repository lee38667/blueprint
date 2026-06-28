// App-wide ambient art. Fixed behind all content, faded + bottom-masked so it
// never hurts legibility. Theme-aware: scenes are toggled by [data-theme] in
// globals.css (no JS read → no SSR hydration mismatch). Colors come from
// --theme-accent so every theme tints its own scene. Motion respects
// prefers-reduced-motion via the global reduced-motion rule.
export default function AmbientBackdrop() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      {/* AOZORA — rising-sun rings, mountain ranges, speed lines */}
      <svg className="scene aozora" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMin slice">
        <defs>
          <radialGradient id="amb-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--theme-accent)" stopOpacity="0.5" />
            <stop offset="60%" stopColor="var(--theme-accent)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--theme-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="1120" cy="240" r="320" fill="url(#amb-sun)" />
        <circle cx="1120" cy="240" r="150" fill="none" stroke="var(--theme-accent)" strokeWidth="2" opacity="0.4" />
        <circle cx="1120" cy="240" r="200" fill="none" stroke="var(--theme-accent)" strokeWidth="1.5" opacity="0.22" />
        <g opacity="0.9">
          <path d="M0 560 L240 430 L470 560 L700 400 L960 580 L1200 440 L1440 560 L1440 900 L0 900 Z" fill="var(--theme-accent)" opacity="0.1" />
          <path d="M0 680 L300 540 L560 680 L820 520 L1080 680 L1440 540 L1440 900 L0 900 Z" fill="var(--theme-accent)" opacity="0.08" />
        </g>
        <g stroke="var(--theme-accent)" strokeWidth="2" opacity="0.18">
          <line x1="120" y1="120" x2="360" y2="60" />
          <line x1="80" y1="180" x2="300" y2="130" />
          <line x1="150" y1="240" x2="330" y2="205" />
        </g>
      </svg>

      {/* GRACE — soft halo, light rays, drifting petals */}
      <svg className="scene grace" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMin slice">
        <defs>
          <radialGradient id="amb-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--theme-accent)" stopOpacity="0.45" />
            <stop offset="55%" stopColor="var(--theme-accent)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--theme-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="720" cy="220" r="340" fill="url(#amb-halo)" />
        <g stroke="var(--theme-accent)" strokeWidth="3" opacity="0.16" strokeLinecap="round">
          <line x1="720" y1="220" x2="720" y2="-20" />
          <line x1="720" y1="220" x2="500" y2="10" />
          <line x1="720" y1="220" x2="940" y2="10" />
          <line x1="720" y1="220" x2="380" y2="140" />
          <line x1="720" y1="220" x2="1060" y2="140" />
        </g>
        <path d="M0 640 Q360 540 720 620 T1440 600 L1440 900 L0 900 Z" fill="var(--theme-accent)" opacity="0.12" />
        <path d="M0 730 Q400 660 800 720 T1440 700 L1440 900 L0 900 Z" fill="var(--theme-accent)" opacity="0.08" />
        <g className="amb-float" fill="var(--theme-accent)" opacity="0.4">
          <path d="M260 300 q14 -22 28 0 q-14 8 -28 0 z" />
          <path d="M1130 360 q14 -22 28 0 q-14 8 -28 0 z" />
          <path d="M980 220 q12 -18 24 0 q-12 7 -24 0 z" />
        </g>
      </svg>

      {/* GENERIC (dark / electric / midnight / pink) — soft accent orbs */}
      <svg className="scene generic" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMin slice">
        <defs>
          <radialGradient id="amb-orb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--theme-accent)" stopOpacity="0.35" />
            <stop offset="60%" stopColor="var(--theme-accent)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--theme-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="1180" cy="180" r="300" fill="url(#amb-orb)" />
        <circle cx="180" cy="760" r="260" fill="url(#amb-orb)" />
      </svg>
    </div>
  )
}
