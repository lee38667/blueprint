import { ReactNode } from 'react'

export default function Card({ title, children }: { title?: string; children?: ReactNode }){
  return (
    <div className="p-4 bg-gray-900 rounded shadow">
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      <div>{children}</div>
    </div>
  )
}
