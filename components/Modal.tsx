import { ReactNode } from 'react'

export default function Modal({ children, onClose }: { children: ReactNode; onClose?: ()=>void }){
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="bg-gray-900 p-6 rounded z-10 w-full max-w-2xl">{children}</div>
    </div>
  )
}
