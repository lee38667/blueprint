import { useState, useCallback, useRef, useEffect } from 'react'
import { useAIBrain } from './useAIBrain'
import { supabase } from '../lib/supabaseClient'
import { authedFetch } from '../lib/apiClient'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  calendarAction?: CalendarActionResult
}

export interface CalendarAction {
  type: 'create_event'
  summary: string
  description?: string
  start: string
  end: string
  location?: string
}

export interface CalendarActionResult {
  action: CalendarAction
  status: 'pending' | 'confirmed' | 'created' | 'failed'
  error?: string
  eventId?: string
}

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMemory {
  id: string
  content: string
  category: string
  created_at: string
}

export function useChat() {
  const { ready, snapshot } = useAIBrain()

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationsLoading, setConversationsLoading] = useState(true)

  // Messages
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Memories
  const [memories, setMemories] = useState<ChatMemory[]>([])
  const [memoriesLoading, setMemoriesLoading] = useState(true)

  // Load conversations and memories on mount
  useEffect(() => {
    loadConversations()
    loadMemories()
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('chat_conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50)

      if (data) setConversations(data)
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setConversationsLoading(false)
    }
  }, [])

  const loadConversation = useCallback(async (id: string) => {
    if (id === conversationId) return

    setConversationId(id)
    setMessages([])
    setMessagesLoading(true)
    setError(null)

    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('id, role, content, calendar_action, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at).getTime(),
          calendarAction: m.calendar_action
            ? { action: m.calendar_action as unknown as CalendarAction, status: 'created' as const }
            : undefined
        })))
      }
    } catch (err) {
      console.error('Failed to load conversation:', err)
    } finally {
      setMessagesLoading(false)
    }
  }, [conversationId])

  const startNewChat = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setConversationId(null)
    setMessages([])
    setError(null)
    setLoading(false)
  }, [])

  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from('chat_conversations').delete().eq('id', id)
    setConversations(prev => prev.filter(c => c.id !== id))
    if (conversationId === id) {
      startNewChat()
    }
  }, [conversationId, startNewChat])

  const renameConversation = useCallback(async (id: string, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return

    await supabase
      .from('chat_conversations')
      .update({ title: trimmed })
      .eq('id', id)

    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, title: trimmed } : c
    ))
  }, [])

  // Memories
  const loadMemories = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('chat_memories')
        .select('id, content, category, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) setMemories(data)
    } catch (err) {
      console.error('Failed to load memories:', err)
    } finally {
      setMemoriesLoading(false)
    }
  }, [])

  const deleteMemory = useCallback(async (id: string) => {
    await supabase.from('chat_memories').delete().eq('id', id)
    setMemories(prev => prev.filter(m => m.id !== id))
  }, [])

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return

    let userId: string | null = null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    } catch {
      // continue without persistence
    }

    // Create or reuse conversation
    let convId = conversationId
    if (!convId && userId) {
      const title = content.trim().length > 80
        ? content.trim().slice(0, 77) + '...'
        : content.trim()

      const { data } = await supabase
        .from('chat_conversations')
        .insert({ user_id: userId, title })
        .select('id, title, created_at, updated_at')
        .single()

      if (data) {
        convId = data.id
        setConversationId(convId)
        setConversations(prev => [data, ...prev])
      }
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)
    setError(null)

    // Save user message to DB
    if (convId) {
      const { data: savedMsg } = await supabase
        .from('chat_messages')
        .insert({ conversation_id: convId, role: 'user', content: content.trim() })
        .select('id')
        .single()

      if (savedMsg) {
        userMessage.id = savedMsg.id
        setMessages(prev => prev.map(m =>
          m.timestamp === userMessage.timestamp && m.role === 'user'
            ? { ...m, id: savedMsg.id }
            : m
        ))
      }
    }

    // Build messages array for API
    const apiMessages = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content
    }))

    try {
      abortRef.current = new AbortController()
      const res = await authedFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          snapshot: ready ? snapshot : undefined,
          memories: memories.map(m => m.content)
        }),
        signal: abortRef.current.signal
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to get response')
        return
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        calendarAction: data.calendarAction
          ? { action: data.calendarAction, status: 'pending' }
          : undefined
      }

      setMessages(prev => [...prev, assistantMessage])

      // Save assistant message to DB
      if (convId) {
        const { data: savedAssistant } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: convId,
            role: 'assistant',
            content: data.reply,
            calendar_action: data.calendarAction || null
          })
          .select('id')
          .single()

        if (savedAssistant) {
          setMessages(prev => prev.map(m =>
            m.timestamp === assistantMessage.timestamp && m.role === 'assistant'
              ? { ...m, id: savedAssistant.id }
              : m
          ))
        }

        // Update conversation timestamp
        await supabase
          .from('chat_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId)

        // Move conversation to top of list
        setConversations(prev => {
          const conv = prev.find(c => c.id === convId)
          if (!conv) return prev
          return [
            { ...conv, updated_at: new Date().toISOString() },
            ...prev.filter(c => c.id !== convId)
          ]
        })
      }

      // Save any extracted memories
      if (data.memories && data.memories.length > 0 && userId) {
        for (const mem of data.memories) {
          const { data: savedMem } = await supabase
            .from('chat_memories')
            .insert({
              user_id: userId,
              content: mem.content,
              category: mem.category || 'general',
              source_conversation_id: convId
            })
            .select('id, content, category, created_at')
            .single()

          if (savedMem) {
            setMemories(prev => [savedMem, ...prev])
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to send message')
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [messages, loading, ready, snapshot, conversationId, memories])

  const confirmCalendarAction = useCallback(async (messageId: string) => {
    const msg = messages.find(m => m.id === messageId)
    if (!msg?.calendarAction?.action) return

    // Update status to confirmed
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, calendarAction: { ...m.calendarAction!, status: 'confirmed' as const } }
        : m
    ))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const action = msg.calendarAction.action

      const res = await fetch('/api/calendar/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          summary: action.summary,
          description: action.description,
          start: action.start,
          end: action.end,
          location: action.location,
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to create event')

      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, calendarAction: { ...m.calendarAction!, status: 'created' as const, eventId: data.event?.id } }
          : m
      ))

      // Update calendar_action in DB
      if (conversationId) {
        await supabase
          .from('chat_messages')
          .update({ calendar_action: { ...action, status: 'created', eventId: data.event?.id } })
          .eq('id', messageId)
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, calendarAction: { ...m.calendarAction!, status: 'failed' as const, error: err.message } }
          : m
      ))
    }
  }, [messages, conversationId])

  return {
    // Conversations
    conversations,
    conversationId,
    conversationsLoading,
    loadConversation,
    startNewChat,
    deleteConversation,
    renameConversation,

    // Messages
    messages,
    messagesLoading,
    loading,
    error,
    sendMessage,
    confirmCalendarAction,

    // Memories
    memories,
    memoriesLoading,
    deleteMemory,
  }
}

export default useChat
