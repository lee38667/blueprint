import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useMotivationBoard } from '../../hooks/useMotivationBoard'
import { useState } from 'react'

export default function MotivationPage(){
  const { items, loading, addItem, removeItem } = useMotivationBoard()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title && !body) return
    await addItem({ title, body, kind: 'quote' })
    setTitle('')
    setBody('')
  }

  return (
    <div className="min-h-screen flex bg-black text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-display font-bold">Motivation Board</h1>
          </div>

          <Card title="Add Inspiration">
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Short title or quote"
                className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
              />
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Optional longer note"
                rows={3}
                className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric resize-none"
              />
              <Button variant="primary" className="text-xs w-full">Save</Button>
            </form>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              <Card><div className="card-skeleton h-24" /></Card>
            ) : items.map(item => (
              <Card key={item.id}>
                <div className="flex flex-col gap-2">
                  {item.title && <div className="text-sm font-semibold text-white">{item.title}</div>}
                  {item.body && <div className="text-sm text-minimal-gray">{item.body}</div>}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="mt-2 text-[11px] text-gray-500 hover:text-red-400 self-start"
                  >
                    Remove
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
