import { ReactNode } from 'react'

export default function FloatingActionButton({ children, onClick }: { children?: ReactNode; onClick?: ()=>void }){
  return (
    <button onClick={onClick} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-neon text-black flex items-center justify-center shadow-lg">
      {children ?? '+'}
    </button>
  )
}
