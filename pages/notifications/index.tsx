import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import VoiceInputButton from '../../components/VoiceInputButton'
import { useNotifications } from '../../hooks/useNotifications'
import { CardSkeleton } from '../../components/Skeleton'
import { getGentleNudge, getNotificationReason } from '../../lib/focusEngine'

function groupLabel(dueAt: string | null) {
  if (!dueAt) return 'Soft queue'
  const due = new Date(dueAt)
  const now = new Date()
  const diff = due.getTime() - now.getTime()
  if (diff <= 60 * 60 * 1000) return 'Now'
  if (diff <= 6 * 60 * 60 * 1000) return 'Later today'
  return 'Upcoming'
}

export default function NotificationsPage() {
  const { items, loading, addNotification, updateNotification, deleteNotification, clearDone } = useNotifications()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [due, setDue] = useState('')
  const [tab, setTab] = useState<'active' | 'done'>('active')

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
    const riskyPending = items.some((item) => item.status === 'pending' && /habit|stress|overdue/i.test(item.title))
    if (riskyPending) {
      navigator.vibrate([40, 30, 40])
    }
  }, [items])

  const filteredItems = useMemo(
    () => items.filter((item) => tab === 'done' ? item.status === 'done' : item.status !== 'done'),
    [items, tab],
  )

  const grouped = useMemo(() => {
    return filteredItems.reduce<Record<string, typeof items>>((acc, item) => {
      const key = tab === 'done' ? 'Completed' : groupLabel(item.due_at)
      acc[key] = [...(acc[key] || []), item]
      return acc
    }, {})
  }, [filteredItems, tab])

  const activeCount = items.filter((item) => item.status !== 'done').length
  const doneCount = items.length - activeCount

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title) return
    await addNotification({ title, message, due_at: due || null })
    setTitle('')
    setMessage('')
    setDue('')
  }

  const snoozeByMinutes = async (id: string, minutes: number) => {
    const nextDue = new Date(Date.now() + minutes * 60 * 1000).toISOString()
    await updateNotification(id, { status: 'pending', due_at: nextDue })
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <h1 className="heading-xl">Notifications</h1>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg p-0.5" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
              {(['active', 'done'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className="px-3 py-1.5 rounded-md text-xs capitalize"
                  style={{
                    background: tab === value ? 'var(--theme-accent)' : 'transparent',
                    color: tab === value ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
                  }}
                >
                  {value} ({value === 'active' ? activeCount : doneCount})
                </button>
              ))}
            </div>
            {tab === 'done' && doneCount > 0 && (
              <Button size="sm" variant="outline" onClick={() => clearDone()}>Clear all</Button>
            )}
          </div>
        </div>

        <Card title="Create Reminder" subtitle="Gentle prompts with context and low-friction snoozes">
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div className="space-y-2">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Reminder title" className="input-base" />
              <VoiceInputButton onTranscript={(text) => setTitle((current) => `${current} ${text}`.trim())} compact />
            </div>
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" className="input-base" />
            <input type="datetime-local" value={due} onChange={(event) => setDue(event.target.value)} className="input-base" />
            <Button variant="primary" className="text-xs w-full" type="submit">Schedule</Button>
          </form>
        </Card>

        {Object.entries(grouped).map(([label, group]) => (
          <Card key={label} title={label}>
            <div className="space-y-3">
              {loading ? (
                <CardSkeleton className="h-24" />
              ) : group.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 p-3 rounded-xl" style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--theme-text)' }}>{item.title}</div>
                      <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                        {item.due_at ? new Date(item.due_at).toLocaleString() : 'Anytime'}
                      </div>
                      {item.message && <div className="text-sm mt-1" style={{ color: 'var(--theme-text-dim)' }}>{item.message}</div>}
                    </div>
                    <div className="flex gap-2 text-xs flex-wrap">
                      {item.status !== 'done' && <button onClick={() => snoozeByMinutes(item.id, 15)} className="px-3 py-1 rounded" style={{ border: '1px solid var(--theme-border)' }}>Snooze 15m</button>}
                      {item.status !== 'done' && <button onClick={() => snoozeByMinutes(item.id, 60)} className="px-3 py-1 rounded" style={{ border: '1px solid var(--theme-border)' }}>Snooze 1h</button>}
                      {item.status !== 'done' && <button onClick={() => updateNotification(item.id, { status: 'done' })} className="btn-accent px-3 py-1 rounded">Done</button>}
                      <button onClick={() => deleteNotification(item.id)} className="px-3 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10">Delete</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg p-3" style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                      <p className="uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>Why now?</p>
                      <p style={{ color: 'var(--theme-text-dim)' }}>{getNotificationReason(item.title, item.due_at)}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                      <p className="uppercase tracking-wide mb-1" style={{ color: 'var(--theme-text-muted)' }}>Gentle poke</p>
                      <p style={{ color: 'var(--theme-text-dim)' }}>{getGentleNudge(item.title)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && group.length === 0 && <div className="subtle-muted text-sm">Nothing scheduled.</div>}
            </div>
          </Card>
        ))}

        {!loading && items.length === 0 && (
          <Card>
            <div className="subtle-muted text-sm">Nothing scheduled.</div>
          </Card>
        )}
      </div>
    </Layout>
  )
}
