import { useEffect, useState } from 'react'

interface Props {
  trigger: number
}

const particles = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  left: `${8 + index * 6}%`,
  drift: index % 2 === 0 ? '-1' : '1',
  delay: `${(index % 4) * 0.05}s`,
  color: index % 3 === 0 ? 'var(--theme-accent)' : index % 3 === 1 ? '#f59e0b' : '#22c55e',
}))

export default function RewardBurst({ trigger }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!trigger) return
    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 900)
    return () => window.clearTimeout(timer)
  }, [trigger])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="reward-particle"
          style={{
            left: particle.left,
            background: particle.color,
            animationDelay: particle.delay,
            ['--particle-x' as any]: particle.drift,
          }}
        />
      ))}
    </div>
  )
}
