import { ReactNode } from 'react'
import { motion } from 'framer-motion'

export default function FloatingActionButton({ children, onClick }: { children?: ReactNode; onClick?: ()=>void }){
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.98 }}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-electric/80 text-black flex items-center justify-center shadow-xl ring-1 ring-white/20 backdrop-blur-xl"
    >
      {children ?? '+'}
    </motion.button>
  )
}
