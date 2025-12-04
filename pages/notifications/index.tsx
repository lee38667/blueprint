import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useNotifications } from '../../hooks/useNotifications'
import { useState } from 'react'

export default function NotificationsPage(){
  const { items, loading, addNotification, updateNotification } = useNotifications()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [due, setDue] = useState('')

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title) return
    await addNotification({ title, message, due_at: due || null })
    setTitle(''); setMessage(''); setDue('')
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6 space-y-6">
          <h1 className="text-2xl font-display font-bold">Notifications</h1>
          <Card title="Create Reminder">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Reminder title" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
              <input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
              <input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)} className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
              <Button variant="primary" className="text-xs w-full md:w-auto">Schedule</Button>
            </form>
          </Card>
          <Card title="Upcoming">
            <div className="space-y-3">
              {loading ? <div className="card-skeleton h-24"/> : items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-neutral-500">{item.due_at ? new Date(item.due_at).toLocaleString() : 'Anytime'}</div>
                    {item.message && <div className="text-sm text-neutral-300">{item.message}</div>}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button onClick={()=>updateNotification(item.id, { status: 'snoozed' })} className="px-3 py-1 rounded border border-white/10">Snooze</button>
                    <button onClick={()=>updateNotification(item.id, { status: 'done' })} className="btn-glow px-3 py-1 rounded">Done</button>
                  </div>
                </div>
              ))}
              {(!loading && items.length === 0) && <div className="subtle-muted">Nothing scheduled.</div>}
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
