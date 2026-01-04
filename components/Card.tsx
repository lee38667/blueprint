import { ReactNode } from 'react'

export default function Card({ title, children, className = '' }: { title?: string; children?: ReactNode; className?: string }){
  return (
    <div
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
    </div>
  )
}

