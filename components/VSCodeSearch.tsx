import { useEffect, useState } from 'react'
import Fuse from 'fuse.js'

export default function VSCodeSearch({ onClose }: { onClose?: ()=>void }){
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])

  const items = [
    { id: '/dashboard', title: 'Dashboard' },
    { id: '/notes', title: 'Notes' },
    { id: '/life-areas', title: 'Life Areas' },
    { id: '/gym', title: 'Gym' },
    { id: '/finance', title: 'Finance' },
    { id: '/skills', title: 'Skills' },
    { id: '/content', title: 'Content Library' }
  ]

  useEffect(()=>{
    const fuse = new Fuse(items, { keys: ['title'] })
    if (!query) return setResults([])
    const r = fuse.search(query).map(x=>x.item)
    setResults(r)
  }, [query])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-8">
      <div className="w-full max-w-2xl bg-gray-900 rounded shadow p-4">
        <div className="flex gap-2 items-center">
          <input autoFocus value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Type to search..." className="flex-1 p-2 bg-gray-800 rounded" />
          <button onClick={onClose} className="px-3 py-2 bg-gray-700 rounded">Close</button>
        </div>
        <div className="mt-3">
          {results.map(r => (
            <div key={r.id} className="p-2 hover:bg-gray-800 rounded">{r.title}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
