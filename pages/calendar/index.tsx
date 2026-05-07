import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useCalendar } from '../../hooks/useCalendar'
import { Icons } from '../../components/icons'
import { CardSkeleton } from '../../components/Skeleton'
import { useState, useMemo } from 'react'
import { useToastStore } from '../../lib/toastStore'

export default function CalendarPage() {
  const { events, connected, loading, error, connect, refresh, createEvent } = useCalendar()
  const addToast = useToastStore((s) => s.addToast)
  const [view, setView] = useState<'week' | 'month'>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [creating, setCreating] = useState(false)

  // Add event form state
  const [newEvent, setNewEvent] = useState({
    summary: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    allDay: false,
  })

  const weekDays = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    const dayOfWeek = today.getDay()
    startOfWeek.setDate(today.getDate() - dayOfWeek + (weekOffset * 7))

    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      days.push(d)
    }
    return days
  }, [weekOffset])

  const monthDays = useMemo(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay()

    const days: (Date | null)[] = []
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }, [])

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10)
    return events.filter((e) => {
      const eventDate = new Date(e.start).toISOString().slice(0, 10)
      return eventDate === dateStr
    })
  }

  const isToday = (date: Date) => {
    return date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.summary.trim()) return

    setCreating(true)
    try {
      let start: string
      let end: string

      if (newEvent.allDay) {
        start = newEvent.date
        const nextDay = new Date(newEvent.date)
        nextDay.setDate(nextDay.getDate() + 1)
        end = nextDay.toISOString().slice(0, 10)
      } else {
        start = new Date(`${newEvent.date}T${newEvent.startTime}`).toISOString()
        end = new Date(`${newEvent.date}T${newEvent.endTime}`).toISOString()
      }

      await createEvent({
        summary: newEvent.summary,
        description: newEvent.description || undefined,
        start,
        end,
        location: newEvent.location || undefined,
      })

      addToast('Event created successfully', 'success')
      setShowAddForm(false)
      setNewEvent({
        summary: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        allDay: false,
      })
    } catch (err: any) {
      addToast(err.message || 'Failed to create event', 'error')
    } finally {
      setCreating(false)
    }
  }

  const weekLabel = useMemo(() => {
    if (weekDays.length === 0) return ''
    const first = weekDays[0]
    const last = weekDays[6]
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    if (first.getMonth() === last.getMonth()) {
      return `${first.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${last.getDate()}, ${last.getFullYear()}`
    }
    return `${first.toLocaleDateString('en-US', opts)} – ${last.toLocaleDateString('en-US', opts)}, ${last.getFullYear()}`
  }, [weekDays])

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto space-y-6 py-4">
          <CardSkeleton className="h-12" />
          <CardSkeleton className="h-96" />
        </div>
      </Layout>
    )
  }

  if (!connected) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-4">
          <h1 className="heading-xl mb-6">Calendar</h1>
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
              >
                <Icons.Calendar size="lg" style={{ color: 'var(--theme-accent)' }} />
              </div>
              <h2 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--theme-text)' }}>
                Connect Google Calendar
              </h2>
              <p className="text-sm mb-6 max-w-md" style={{ color: 'var(--theme-text-muted)' }}>
                Connect your Google Calendar to see your schedule, create events, and let the AI assistant manage your calendar.
              </p>
              <Button variant="primary" onClick={connect}>
                Connect Calendar
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-4 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="heading-xl">Calendar</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              Your Google Calendar schedule
            </p>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="p-2 rounded-lg transition-colors"
              style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
              title="Refresh events"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--theme-border)' }}
            >
              <button
                onClick={() => setView('week')}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: view === 'week' ? 'var(--theme-accent)' : 'transparent',
                  color: view === 'week' ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
                }}
              >
                Week
              </button>
              <button
                onClick={() => setView('month')}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: view === 'month' ? 'var(--theme-accent)' : 'transparent',
                  color: view === 'month' ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
                }}
              >
                Month
              </button>
            </div>
            <Button
              variant="primary"
              className="text-xs"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              + New Event
            </Button>
          </div>
        </div>

        {/* Add Event Form */}
        {showAddForm && (
          <Card title="Create Event">
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Title</label>
                  <input
                    value={newEvent.summary}
                    onChange={(e) => setNewEvent((p) => ({ ...p, summary: e.target.value }))}
                    placeholder="Event title"
                    className="input-base w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent((p) => ({ ...p, date: e.target.value }))}
                    className="input-base w-full"
                    required
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer pb-2.5" style={{ color: 'var(--theme-text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={newEvent.allDay}
                      onChange={(e) => setNewEvent((p) => ({ ...p, allDay: e.target.checked }))}
                      className="rounded"
                    />
                    All day
                  </label>
                </div>
                {!newEvent.allDay && (
                  <>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Start Time</label>
                      <input
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent((p) => ({ ...p, startTime: e.target.value }))}
                        className="input-base w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>End Time</label>
                      <input
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent((p) => ({ ...p, endTime: e.target.value }))}
                        className="input-base w-full"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Location</label>
                  <input
                    value={newEvent.location}
                    onChange={(e) => setNewEvent((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Optional"
                    className="input-base w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Description</label>
                  <input
                    value={newEvent.description}
                    onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Optional"
                    className="input-base w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="primary" type="submit" className="text-xs" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Event'}
                </Button>
                <Button variant="outline" className="text-xs" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Week View */}
        {view === 'week' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                className="p-2 rounded-lg transition-colors"
                style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                  {weekLabel}
                </span>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="text-[11px] px-2 py-0.5 rounded"
                    style={{ background: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }}
                  >
                    Today
                  </button>
                )}
              </div>
              <button
                onClick={() => setWeekOffset((o) => o + 1)}
                className="p-2 rounded-lg transition-colors"
                style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayEvents = getEventsForDate(day)
                const today = isToday(day)

                return (
                  <div
                    key={day.toISOString()}
                    className="rounded-xl p-3 min-h-[120px] transition-colors"
                    style={{
                      background: today ? 'var(--theme-surface-hover)' : 'var(--theme-surface)',
                      border: today ? '1px solid var(--theme-accent)' : '1px solid var(--theme-border)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[11px] uppercase tracking-wide ${today ? 'font-bold' : ''}`}
                        style={{ color: today ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }}
                      >
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span
                        className={`text-sm font-medium ${today ? 'font-bold' : ''}`}
                        style={{ color: today ? 'var(--theme-accent)' : 'var(--theme-text)' }}
                      >
                        {day.getDate()}
                      </span>
                    </div>

                    {dayEvents.length === 0 ? (
                      <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)', opacity: 0.5 }}>
                        No events
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="rounded-lg px-2.5 py-1.5 text-[11px] leading-snug"
                            style={{
                              background: 'var(--theme-accent)',
                              color: 'var(--theme-accent-text)',
                              opacity: 0.9,
                            }}
                          >
                            <div className="font-medium truncate">{event.summary}</div>
                            {event.start && !event.start.match(/^\d{4}-\d{2}-\d{2}$/) && (
                              <div className="opacity-75 mt-0.5">{formatTime(event.start)}</div>
                            )}
                            {event.location && (
                              <div className="opacity-70 truncate mt-0.5">{event.location}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Month View */}
        {view === 'month' && (
          <div>
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--theme-text)' }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-[10px] uppercase tracking-wide py-1" style={{ color: 'var(--theme-text-muted)' }}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day, i) => {
                if (!day) {
                  return <div key={`empty-${i}`} className="aspect-square" />
                }

                const dayEvents = getEventsForDate(day)
                const today = isToday(day)

                return (
                  <div
                    key={day.toISOString()}
                    className="aspect-square rounded-lg p-1.5 flex flex-col transition-colors overflow-hidden"
                    style={{
                      background: today ? 'var(--theme-surface-hover)' : 'var(--theme-surface)',
                      border: today ? '1px solid var(--theme-accent)' : '1px solid var(--theme-border)',
                    }}
                  >
                    <span
                      className={`text-[11px] ${today ? 'font-bold' : ''}`}
                      style={{ color: today ? 'var(--theme-accent)' : 'var(--theme-text-dim)' }}
                    >
                      {day.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex-1 mt-0.5 space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="text-[9px] leading-tight px-1 py-0.5 rounded truncate"
                            style={{ background: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }}
                            title={event.summary}
                          >
                            {event.summary}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px]" style={{ color: 'var(--theme-text-muted)' }}>
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Upcoming Events List */}
        <Card title="Upcoming Events">
          {events.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              No upcoming events in the next 7 days.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => {
                const startDate = new Date(event.start)
                const isAllDay = /^\d{4}-\d{2}-\d{2}$/.test(event.start)

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                    style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }}
                    >
                      <span className="text-[9px] uppercase leading-none">
                        {startDate.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold leading-none">{startDate.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>
                        {event.summary}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                          {isAllDay
                            ? 'All day'
                            : `${formatTime(event.start)} – ${formatTime(event.end)}`}
                        </span>
                        {event.location && (
                          <span className="text-[11px] truncate" style={{ color: 'var(--theme-text-muted)' }}>
                            {event.location}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}
