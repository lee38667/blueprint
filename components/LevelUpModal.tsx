import { motion } from 'framer-motion'
import type { SkillChoice } from '../lib/gamification'

interface LevelUpModalProps {
  open: boolean
  level: number
  narrative: string
  choices: SkillChoice[]
  unlockedAreas: string[]
  onClose: () => void
  onClaim: (choice: SkillChoice) => Promise<boolean>
}

export default function LevelUpModal({ open, level, narrative, choices, unlockedAreas, onClose, onClaim }: LevelUpModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <div className="modal-backdrop" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="modal-panel relative z-[91] w-full max-w-2xl overflow-hidden border"
      >
        <div className="absolute inset-0 opacity-90" style={{ background: 'radial-gradient(circle at top, rgba(56, 189, 248, 0.18), transparent 60%), linear-gradient(180deg, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0.98))' }} />
        <div className="relative space-y-6 p-6 md:p-8">
          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-accent">Level Up</p>
            <h2 className="heading-lg">Hunter Rank {level}</h2>
            <p className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>{narrative}</p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {unlockedAreas.map((area) => (
                <span key={area} className="badge badge-accent">{area}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {choices.map((choice) => (
              <button
                key={choice.name}
                type="button"
                onClick={() => void onClaim(choice)}
                className="rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5"
                style={{
                  borderColor: 'rgba(56, 189, 248, 0.2)',
                  background: 'rgba(15, 23, 42, 0.7)',
                }}
              >
                <div className="space-y-2">
                  <div className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{choice.name}</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-dim)' }}>{choice.description}</p>
                  <span className="badge badge-accent">Claim Skill</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <button type="button" onClick={onClose} className="btn-outline text-xs">Maybe later</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
