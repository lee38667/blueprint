import { ReactNode } from 'react'
import { motion } from 'framer-motion'

export default function FloatingActionButton({ children, onClick, label }: { children?: ReactNode; onClick?: () => void; label?: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.98 }}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl backdrop-blur-xl"
      style={{
        background: 'color-mix(in srgb, var(--theme-accent) 80%, transparent)',
        color: 'var(--theme-accent-text)',
        boxShadow: '0 0 0 1px var(--theme-border), 0 8px 24px rgba(0,0,0,0.3)',
      }}
      aria-label={label || 'Action button'}
    >
      {children ?? '+'}
    </motion.button>
  )
}
