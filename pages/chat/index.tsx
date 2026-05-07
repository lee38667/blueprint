import Layout from '../../components/Layout'
import { Icons } from '../../components/icons'
import { useChat, ChatMessage, CalendarActionResult, Conversation, ChatMemory } from '../../hooks/useChat'
import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SUGGESTIONS = [
  'What should I focus on today?',
  'How has my mood been this week?',
  'Summarize my progress on goals',
  'What tasks are overdue?',
  'Schedule a workout for tomorrow at 7am',
  'What does my calendar look like this week?',
]

const CATEGORY_LABELS: Record<string, string> = {
  preference: 'Preference',
  person: 'Person',
  schedule: 'Schedule',
  health: 'Health',
  work: 'Work',
  hobby: 'Hobby',
  general: 'General',
}

// ── Helpers ──────────────────────────────────────────────

function groupConversationsByDate(conversations: Conversation[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)
  const monthAgo = new Date(today.getTime() - 30 * 86400000)

  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'This Week', items: [] },
    { label: 'This Month', items: [] },
    { label: 'Older', items: [] },
  ]

  conversations.forEach(c => {
    const d = new Date(c.updated_at)
    if (d >= today) groups[0].items.push(c)
    else if (d >= yesterday) groups[1].items.push(c)
    else if (d >= weekAgo) groups[2].items.push(c)
    else if (d >= monthAgo) groups[3].items.push(c)
    else groups[4].items.push(c)
  })

  return groups.filter(g => g.items.length > 0)
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Calendar Action Card ─────────────────────────────────

function CalendarActionCard({ messageId, action, onConfirm }: {
  messageId: string
  action: CalendarActionResult
  onConfirm: (messageId: string) => void
}) {
  const { action: event, status, error } = action
  const isAllDay = /^\d{4}-\d{2}-\d{2}$/.test(event.start)

  const formatDt = (dt: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dt)) {
      return new Date(dt + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }
    return new Date(dt).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    })
  }

  return (
    <div
      className="mt-2 rounded-xl p-3"
      style={{ background: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icons.Calendar size="sm" style={{ color: 'var(--theme-accent)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--theme-text)' }}>
          {status === 'created' ? 'Event Created' : status === 'failed' ? 'Failed' : 'Schedule Event'}
        </span>
      </div>
      <div className="space-y-1 text-[12px]" style={{ color: 'var(--theme-text-dim)' }}>
        <div className="font-medium">{event.summary}</div>
        <div>{isAllDay ? 'All day' : `${formatDt(event.start)} – ${formatDt(event.end)}`}</div>
        {event.location && <div>{event.location}</div>}
        {event.description && <div className="opacity-75">{event.description}</div>}
      </div>

      {status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onConfirm(messageId)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }}
          >
            Add to Calendar
          </button>
        </div>
      )}
      {status === 'confirmed' && (
        <div className="mt-2 text-[11px] flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
          <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--theme-accent)' }} />
          Creating event...
        </div>
      )}
      {status === 'created' && (
        <div className="mt-2 text-[11px] font-medium" style={{ color: 'var(--theme-accent)' }}>
          Added to Google Calendar
        </div>
      )}
      {status === 'failed' && error && (
        <div className="mt-2 text-[11px]" style={{ color: 'var(--color-error)' }}>
          {error}
        </div>
      )}
    </div>
  )
}

// ── Conversation Sidebar ─────────────────────────────────

function ChatSidebar({
  conversations,
  conversationId,
  memories,
  onSelect,
  onNew,
  onDelete,
  onDeleteMemory,
  onClose,
  isOpen,
}: {
  conversations: Conversation[]
  conversationId: string | null
  memories: ChatMemory[]
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onDeleteMemory: (id: string) => void
  onClose: () => void
  isOpen: boolean
}) {
  const [search, setSearch] = useState('')
  const [showMemories, setShowMemories] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = search.trim()
    ? conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations

  const groups = useMemo(() => groupConversationsByDate(filtered), [filtered])

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeletingId(id)
  }

  const confirmDelete = (id: string) => {
    onDelete(id)
    setDeletingId(null)
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed md:relative z-50 md:z-auto top-0 left-0 h-full md:h-auto w-[280px] flex-shrink-0 flex flex-col"
        style={{
          background: 'var(--theme-card-bg)',
          borderRight: '1px solid var(--theme-border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--theme-border)' }}>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-1 mr-2"
            style={{
              background: 'var(--theme-accent)',
              color: 'var(--theme-accent-text)',
            }}
          >
            <Icons.Plus size="sm" />
            New Chat
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors md:hidden"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <Icons.X size="sm" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)' }}
          >
            <Icons.Search size="sm" style={{ color: 'var(--theme-text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="bg-transparent outline-none text-sm flex-1"
              style={{ color: 'var(--theme-text)' }}
            />
          </div>
        </div>

        {/* Tabs: Chats / Memories */}
        <div className="flex px-3 gap-1 flex-shrink-0" style={{ borderBottom: '1px solid var(--theme-border)' }}>
          <button
            onClick={() => setShowMemories(false)}
            className="flex-1 py-2 text-xs font-medium transition-colors rounded-t-lg"
            style={{
              color: !showMemories ? 'var(--theme-accent)' : 'var(--theme-text-muted)',
              borderBottom: !showMemories ? '2px solid var(--theme-accent)' : '2px solid transparent',
            }}
          >
            Chats ({conversations.length})
          </button>
          <button
            onClick={() => setShowMemories(true)}
            className="flex-1 py-2 text-xs font-medium transition-colors rounded-t-lg flex items-center justify-center gap-1.5"
            style={{
              color: showMemories ? 'var(--theme-accent)' : 'var(--theme-text-muted)',
              borderBottom: showMemories ? '2px solid var(--theme-accent)' : '2px solid transparent',
            }}
          >
            <Icons.Brain size="sm" />
            Memory ({memories.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {!showMemories ? (
            /* Conversations List */
            <div className="py-2">
              {groups.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Icons.Chat size="lg" style={{ color: 'var(--theme-text-muted)', margin: '0 auto 8px' }} />
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    {search ? 'No matching chats' : 'No past chats yet'}
                  </p>
                </div>
              ) : (
                groups.map(group => (
                  <div key={group.label}>
                    <div className="px-3 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                        {group.label}
                      </span>
                    </div>
                    {group.items.map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => { onSelect(conv.id); onClose() }}
                        className="group flex items-center gap-2 mx-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                        style={{
                          background: conv.id === conversationId ? 'var(--theme-surface-hover)' : 'transparent',
                          color: conv.id === conversationId ? 'var(--theme-text)' : 'var(--theme-text-dim)',
                        }}
                        onMouseEnter={e => {
                          if (conv.id !== conversationId) e.currentTarget.style.background = 'var(--theme-surface)'
                        }}
                        onMouseLeave={e => {
                          if (conv.id !== conversationId) e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <Icons.Chat size="sm" className="flex-shrink-0 opacity-50" />
                        <span className="flex-1 text-sm truncate">{conv.title}</span>
                        <span className="text-[10px] flex-shrink-0 opacity-50">{relativeTime(conv.updated_at)}</span>

                        {/* Delete button */}
                        {deletingId === conv.id ? (
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => confirmDelete(conv.id)}
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: 'var(--color-error)', color: 'white' }}
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ color: 'var(--theme-text-muted)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleDelete(e, conv.id)}
                            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5"
                            style={{ color: 'var(--theme-text-muted)' }}
                          >
                            <Icons.Trash size="sm" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Memories List */
            <div className="py-2">
              {memories.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Icons.Brain size="lg" style={{ color: 'var(--theme-text-muted)', margin: '0 auto 8px' }} />
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    No memories yet. As you chat, the AI will automatically remember important details about you.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 px-2">
                  {memories.map(mem => (
                    <div
                      key={mem.id}
                      className="group flex items-start gap-2 px-3 py-2.5 rounded-lg transition-colors"
                      style={{ background: 'var(--theme-surface)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-dim)' }}>
                          {mem.content}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              background: 'var(--theme-input-bg)',
                              color: 'var(--theme-accent)',
                              border: '1px solid var(--theme-border)',
                            }}
                          >
                            {CATEGORY_LABELS[mem.category] || mem.category}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                            {new Date(mem.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteMemory(mem.id)}
                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 mt-0.5 flex-shrink-0"
                        style={{ color: 'var(--theme-text-muted)' }}
                      >
                        <Icons.X size="sm" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.aside>
    </>
  )
}

// ── Main Chat Page ───────────────────────────────────────

export default function ChatPage() {
  const {
    conversations, conversationId, conversationsLoading,
    messages, messagesLoading, loading, error,
    memories, memoriesLoading,
    sendMessage, loadConversation, startNewChat, deleteConversation,
    confirmCalendarAction, deleteMemory,
  } = useChat()

  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [conversationId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleSuggestion = (text: string) => {
    sendMessage(text)
  }

  const handleNewChat = () => {
    startNewChat()
    setSidebarOpen(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] max-w-6xl mx-auto">
        {/* Sidebar */}
        <ChatSidebar
          conversations={conversations}
          conversationId={conversationId}
          memories={memories}
          onSelect={loadConversation}
          onNew={handleNewChat}
          onDelete={deleteConversation}
          onDeleteMemory={deleteMemory}
          onClose={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between py-3 px-3 md:px-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Sidebar toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg transition-colors md:hidden"
                style={{ color: 'var(--theme-text-dim)', border: '1px solid var(--theme-border)' }}
                aria-label="Open chat history"
              >
                <Icons.Menu size="sm" />
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg transition-colors hidden md:flex"
                style={{ color: 'var(--theme-text-dim)', border: '1px solid var(--theme-border)' }}
                aria-label="Toggle chat history"
              >
                {sidebarOpen ? <Icons.ChevronLeft size="sm" /> : <Icons.ChevronRight size="sm" />}
              </button>

              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }}
              >
                <Icons.Chat size="sm" />
              </div>
              <div>
                <h1 className="text-lg font-display font-bold" style={{ color: 'var(--theme-text)' }}>
                  Blueprint AI
                </h1>
                <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                  {memories.length > 0
                    ? `${memories.length} memor${memories.length === 1 ? 'y' : 'ies'} · Your personal life assistant`
                    : 'Your personal life assistant'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {conversations.length > 0 && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors hidden md:flex items-center gap-1.5"
                  style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
                >
                  <Icons.Chat size="sm" />
                  {conversations.length} chat{conversations.length !== 1 ? 's' : ''}
                </button>
              )}
              {messages.length > 0 && (
                <button
                  onClick={handleNewChat}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
                >
                  <Icons.Plus size="sm" />
                  New chat
                </button>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 md:px-4 space-y-4"
            style={{ minHeight: 0 }}
          >
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
                    style={{ borderColor: 'var(--theme-accent)', borderTopColor: 'transparent' }}
                  />
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Loading conversation...</p>
                </div>
              </div>
            ) : messages.length === 0 && !loading ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
                >
                  <Icons.Chat size="lg" style={{ color: 'var(--theme-accent)' }} />
                </div>
                <h2 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--theme-text)' }}>
                  Ask me anything
                </h2>
                <p className="text-sm mb-8 max-w-md" style={{ color: 'var(--theme-text-muted)' }}>
                  I have access to your tasks, goals, moods, finances, habits, calendar, and more.
                  {memories.length > 0 && ` I remember ${memories.length} thing${memories.length !== 1 ? 's' : ''} about you from past conversations.`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      className="text-left text-sm px-4 py-3 rounded-xl transition-all hover:scale-[1.02]"
                      style={{
                        background: 'var(--theme-surface)',
                        border: '1px solid var(--theme-border)',
                        color: 'var(--theme-text-dim)',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message List */
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                      }`}
                      style={
                        msg.role === 'user'
                          ? {
                              background: 'var(--theme-accent)',
                              color: 'var(--theme-accent-text)',
                            }
                          : {
                              background: 'var(--theme-surface)',
                              border: '1px solid var(--theme-border)',
                              color: 'var(--theme-text-dim)',
                            }
                      }
                    >
                      {msg.role === 'assistant' ? (
                        <div className="chat-markdown" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {/* Calendar Action Card */}
                      {msg.calendarAction && (
                        <CalendarActionCard
                          messageId={msg.id}
                          action={msg.calendarAction}
                          onConfirm={confirmCalendarAction}
                        />
                      )}

                      <div
                        className="text-[10px] mt-1.5 opacity-60"
                        style={{ color: msg.role === 'user' ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)' }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div
                      className="rounded-2xl rounded-bl-md px-4 py-3"
                      style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--theme-accent)', animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--theme-accent)', animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--theme-accent)', animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex justify-center">
                    <p className="text-xs px-3 py-2 rounded-lg" style={{ color: 'var(--color-error)', background: 'var(--color-error-surface)' }}>
                      {error}
                    </p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 pb-4 pt-2 px-3 md:px-4">
            <form onSubmit={handleSubmit} className="relative">
              <div
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Blueprint AI anything..."
                  rows={1}
                  className="w-full bg-transparent px-4 pt-3 pb-2 text-sm resize-none outline-none"
                  style={{
                    color: 'var(--theme-text)',
                    minHeight: '44px',
                    maxHeight: '120px',
                  }}
                />
                <div className="flex items-center justify-between px-3 pb-2">
                  <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                    Shift+Enter for new line
                  </span>
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2 rounded-xl transition-all"
                    style={{
                      background: input.trim() && !loading ? 'var(--theme-accent)' : 'var(--theme-surface-hover)',
                      color: input.trim() && !loading ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
                      opacity: !input.trim() || loading ? 0.5 : 1,
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Desktop sidebar (always visible when open) */}
        <style jsx global>{`
          @media (min-width: 768px) {
            .chat-sidebar-desktop {
              position: relative !important;
              transform: none !important;
            }
          }
        `}</style>
      </div>
    </Layout>
  )
}

/** Simple markdown formatter for assistant messages */
function formatMarkdown(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^[-•]\s+(.+)/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="list-disc pl-4 space-y-1 my-2">$1</ul>')
    // Numbered lists
    .replace(/^\d+\.\s+(.+)/gm, '<li>$1</li>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code style="background:var(--theme-input-bg);padding:1px 4px;border-radius:4px;font-size:12px">$1</code>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="mt-2">')
    // Single newlines to <br>
    .replace(/\n/g, '<br/>')
    // Wrap in paragraph
    .replace(/^(.+)$/, '<p>$1</p>')
}
