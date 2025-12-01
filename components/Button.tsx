import { ReactNode } from 'react'

export default function Button({ children, onClick }: { children: ReactNode; onClick?: ()=>void }){
  return (
    <button onClick={onClick} className="px-4 py-2 rounded bg-electric text-black hover:scale-105 transition-transform">{children}</button>
  )
}
