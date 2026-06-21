import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import VoiceInputButton from '../../components/VoiceInputButton'
import { CardSkeleton } from '../../components/Skeleton'
import { useNotes } from '../../hooks/useNotes'
import { useConfirm } from '../../hooks/useConfirm'
import { useInfiniteList } from '../../hooks/useInfiniteList'
import { exportNotesToCSV } from '../../lib/csvExport'
import { decryptText, encryptText } from '../../lib/encryption'
import { useToastStore } from '../../lib/toastStore'
import type { NoteEntry } from '../../types/models'

// @ts-ignore
const ReactMarkdown: any = dynamic(() => import('react-markdown') as any)

const INITIAL_FORM = {
  title: '',
  content: '',
  tags: '',
  encrypt: false,
  passphrase: ''
}

export default function NotesPage() {
  const { notes, loading, addNote, deleteNote, analyzeNote } = useNotes()
  const { confirm, confirmDialog } = useConfirm()
  const toast = useToastStore()
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [saving, setSaving] = useState(false)
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({})
  const [decryptInputs, setDecryptInputs] = useState<Record<string, string>>({})
  const [decryptErrors, setDecryptErrors] = useState<Record<string, string>>({})
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null)

  const tagOptions = useMemo(() => {
    const result = new Set<string>()
    notes.forEach((note: NoteEntry) => {
      note.tags?.forEach((tag: string) => result.add(tag))
    })
    return Array.from(result).sort()
  }, [notes])

  const filteredNotes = useMemo(() => {
    return notes.filter((note: NoteEntry) => {
      const text = `${note.title ?? ''} ${note.content ?? ''} ${(note.attachments?.aiSummary ?? '')}`.toLowerCase()
      const matchesQuery = !query || text.includes(query.toLowerCase())
      const matchesTag = selectedTag === 'all' || note.tags?.includes(selectedTag)
      return matchesQuery && matchesTag
    })
  }, [notes, query, selectedTag])

  const infinite = useInfiniteList({ items: filteredNotes, initialCount: 8, increment: 6 })

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      let contentPayload = form.content
      const attachments: Record<string, any> = { encrypted: false }
      if (form.encrypt) {
        if (!form.passphrase) throw new Error('Passphrase required to encrypt')
        contentPayload = encryptText(form.content, form.passphrase)
        attachments.encrypted = true
      }
      const tags = form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
      await addNote({
        title: form.title.trim(),
        content: contentPayload,
        tags,
        attachments,
      })
      setForm(INITIAL_FORM)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  const handleDecrypt = (noteId: string, cipher: string) => {
    try {
      const passphrase = decryptInputs[noteId] ?? ''
      if (!passphrase) throw new Error('Enter a passphrase')
      const value = decryptText(cipher, passphrase)
      setDecryptedMap((current) => ({ ...current, [noteId]: value }))
      setDecryptErrors((current) => ({ ...current, [noteId]: '' }))
    } catch (error: any) {
      setDecryptErrors((current) => ({ ...current, [noteId]: error.message }))
    }
  }

  const handleAnalyze = async (note: NoteEntry) => {
    const content = note.attachments?.encrypted ? decryptedMap[note.id] : note.content
    if (!content) {
      toast.error('Decrypt this note before requesting insights.')
      return
    }
    setAiLoadingId(note.id)
    try {
      await analyzeNote(note, content)
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze note')
    } finally {
      setAiLoadingId(null)
    }
  }

  const handleDelete = async (noteId: string, title: string) => {
    const confirmed = await confirm({
      title: 'Delete Note?',
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    })

    if (confirmed) {
      await deleteNote(noteId)
    }
  }

  const handleVoiceTitle = (transcript: string) => {
    setForm((current) => ({ ...current, title: `${current.title} ${transcript}`.trim() }))
  }

  const handleVoiceBody = (transcript: string) => {
    setForm((current) => ({ ...current, content: `${current.content}\n${transcript}`.trim() }))
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 py-4">
        <ConfirmDialog {...confirmDialog} />
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="heading-xl">Notes &amp; Journal</h1>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              Tag entries, encrypt sensitive ones, and let AI surface mood cues automatically.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => exportNotesToCSV(notes)}
              disabled={notes.length === 0}
              className="px-3 py-2 rounded-lg bg-electric/10 border border-electric/30 hover:bg-electric/20 text-electric text-sm font-medium transition-colors"
              title="Export all notes to CSV"
            >
              Export CSV
            </button>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes"
              className="input-base"
            />
            <select value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)} className="input-base">
              <option value="all">All tags</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </header>

        <Card title="New Entry">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Title</label>
                <div className="flex flex-col gap-2">
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="input-base w-full"
                  />
                  <VoiceInputButton onTranscript={handleVoiceTitle} compact />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                  className="input-base w-full"
                  placeholder="reflection, gratitude"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3 mb-1">
                <label className="block text-xs" style={{ color: 'var(--theme-text-muted)' }}>Entry</label>
                <VoiceInputButton onTranscript={handleVoiceBody} compact />
              </div>
              <textarea
                value={form.content}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                rows={6}
                className="input-base w-full"
              />
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={form.encrypt}
                  onChange={(event) => setForm((current) => ({ ...current, encrypt: event.target.checked }))}
                />
                Encrypt this entry
              </label>
              {form.encrypt && (
                <input
                  type="password"
                  placeholder="Passphrase"
                  value={form.passphrase}
                  onChange={(event) => setForm((current) => ({ ...current, passphrase: event.target.value }))}
                  className="input-base"
                />
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="primary" className={`text-xs ${saving ? 'opacity-60' : ''}`} type="submit">
                {saving ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </form>
        </Card>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <Card><CardSkeleton className="h-32" /></Card>
          ) : filteredNotes.length === 0 ? (
            <Card>
              <div className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No entries match that filter yet.</div>
            </Card>
          ) : (
            infinite.visibleItems.map((note: NoteEntry) => {
              const encrypted = Boolean(note.attachments?.encrypted)
              const plaintext = encrypted ? decryptedMap[note.id] : note.content
              return (
                <Card key={note.id} title={note.title || 'Untitled'}>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {note.tags?.map((tag: string) => (
                      <span key={tag} className="text-[11px] px-2 py-1 rounded-full uppercase tracking-wide" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                        {tag}
                      </span>
                    ))}
                    {encrypted && <span className="text-[11px] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-200">Encrypted</span>}
                    {note.attachments?.mood && <span className="text-[11px] px-2 py-1 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-100">Mood: {note.attachments.mood}</span>}
                  </div>

                  {encrypted && !plaintext && (
                    <div className="space-y-3">
                      <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>This note is encrypted. Enter your passphrase to decrypt.</p>
                      <input
                        type="password"
                        value={decryptInputs[note.id] ?? ''}
                        onChange={(event) => setDecryptInputs((current) => ({ ...current, [note.id]: event.target.value }))}
                        placeholder="Passphrase"
                        className="input-base w-full"
                      />
                      {decryptErrors[note.id] && <p className="text-xs text-red-400">{decryptErrors[note.id]}</p>}
                      <div className="flex gap-2">
                        <Button variant="primary" className="text-xs" onClick={() => handleDecrypt(note.id, note.content ?? '')}>Decrypt</Button>
                        <button className="text-xs text-red-300" onClick={() => handleDelete(note.id, note.title || 'Untitled')}>Delete</button>
                      </div>
                    </div>
                  )}

                  {plaintext && (
                    <div className="prose prose-invert prose-sm mb-3 max-w-none">
                      <ReactMarkdown>{plaintext}</ReactMarkdown>
                    </div>
                  )}

                  {note.attachments?.aiSummary && (
                    <div className="rounded-xl p-3 text-sm text-neutral-200 mb-3" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                      <p className="text-xs uppercase mb-1" style={{ color: 'var(--theme-text-muted)' }}>AI Summary</p>
                      <p>{note.attachments.aiSummary}</p>
                      {note.attachments.actionItems?.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs list-disc list-inside" style={{ color: 'var(--theme-text-muted)' }}>
                          {note.attachments.actionItems.map((item: string, index: number) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    <div className="flex flex-wrap gap-2">
                      {note.attachments?.keywords?.slice(0, 4).map((keyword: string) => (
                        <span key={keyword} className="px-2 py-1 rounded" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>{keyword}</span>
                      ))}
                    </div>
                    <span>{note.updated_at ? new Date(note.updated_at).toLocaleDateString() : ''}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    <Button variant="secondary" className={`text-xs ${aiLoadingId === note.id ? 'opacity-50' : ''}`} onClick={() => handleAnalyze(note)}>
                      {aiLoadingId === note.id ? 'Analyzing...' : 'Run AI Analysis'}
                    </Button>
                    <button className="text-red-300" onClick={() => handleDelete(note.id, note.title || 'Untitled')}>Delete</button>
                  </div>
                </Card>
              )
            })
          )}
        </section>

        {!loading && infinite.canLoadMore && (
          <>
            <div ref={infinite.loaderRef} className="h-10" />
            <div className="flex justify-center">
              <Button variant="outline" onClick={infinite.loadMore}>Load more notes</Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
