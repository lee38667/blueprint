import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: string
  end: string
  location?: string
  attendees?: string[]
}

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('calendar_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single()

      setConnected(!!data && !error)
      
      if (data) {
        await fetchEvents()
      }
    } catch (err) {
      console.error('Check connection error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/calendar/events', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const connect = async () => {
    // Force a token refresh so the API gets a valid, non-expired token
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !session) {
      setError('Session expired. Please log in again.')
      return
    }
    window.location.href = `/api/calendar/auth?token=${session.access_token}`
  }

  const disconnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/calendar/disconnect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        setConnected(false)
        setEvents([])
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const createEvent = async (eventData: {
    summary: string
    description?: string
    start: string
    end: string
    location?: string
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch('/api/calendar/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(eventData)
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create event')

      await fetchEvents()
      return data.event
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const refresh = () => {
    fetchEvents()
  }

  return {
    events,
    connected,
    loading,
    error,
    connect,
    disconnect,
    refresh,
    createEvent
  }
}
