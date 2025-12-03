import { ReactNode } from 'react'
import { motion } from 'framer-motion'

export default function Card({ title, children, className = '' }: { title?: string; children?: ReactNode; className?: string }){
  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ translateY: -2 }}
      className={`panel-glass p-6 rounded-2xl shadow-panel ${className}`}
    >
      {title && (
        <div className="mb-4">
          <h3 className="heading-xl text-neutral-200">{title}</h3>
        </div>
      )}
      <div className="text-neutral-300 font-sans text-sm leading-relaxed">
        {children}
      </div>
    </motion.div>
  )
}
