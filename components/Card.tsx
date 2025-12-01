import { ReactNode } from 'react'

export default function Card({ title, children, className = '' }: { title?: string; children?: ReactNode; className?: string }){
  return (
    <div className={`p-6 bg-off-black/40 backdrop-blur-md border border-white/10 rounded-xl hover:border-electric/50 transition-all duration-300 shadow-lg shadow-black/50 ${className}`}>
      {title && <h3 className="font-display font-bold text-xs mb-4 text-gray-500 tracking-widest uppercase">{title}</h3>}
      <div className="text-minimal-gray font-sans text-sm leading-relaxed">{children}</div>
    </div>
  )
}
