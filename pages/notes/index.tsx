import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useNotes } from '../../hooks/useNotes'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { encryptText, decryptText } from '../../lib/encryption'
import type { NoteEntry } from '../../types/models'

const ReactMarkdown = dynamic(() => import('react-markdown'))

const INITIAL_FORM = {
  title: '',
  content: '',
  tags: '',
  encrypt: false,
  passphrase: ''
}

export default function NotesPage() {
  const { notes, loading, addNote, deleteNote, analyzeNote } = useNotes()
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

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
        .map(t => t.trim())
        .filter(Boolean)
      await addNote({
        title: form.title.trim(),
        content: contentPayload,
        tags,
        attachments
      })
      setForm(INITIAL_FORM)
    } catch (error: any) {
      alert(error.message || 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  const handleDecrypt = (noteId: string, cipher: string) => {
    try {
      const pass = decryptInputs[noteId] ?? ''
      if (!pass) throw new Error('Enter a passphrase')
      const value = decryptText(cipher, pass)
      setDecryptedMap(prev => ({ ...prev, [noteId]: value }))
      setDecryptErrors(prev => ({ ...prev, [noteId]: '' }))
    } catch (error: any) {
      setDecryptErrors(prev => ({ ...prev, [noteId]: error.message }))
    }
  }

  const handleAnalyze = async (note: any) => {
    const content = note.attachments?.encrypted ? decryptedMap[note.id] : note.content
    if (!content) {
      alert('Decrypt this note before requesting insights.')
      return
    }
    setAiLoadingId(note.id)
    try {
      await analyzeNote(note, content)
    } catch (error: any) {
      alert(error.message || 'Failed to analyze note')
    } finally {
      setAiLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6 space-y-6">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold">Notes & Journal</h1>
              <p className="text-sm text-neutral-400">Tag entries, encrypt sensitive ones, and let AI surface mood cues automatically.</p>
            </div>
            <div className="flex gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes"
                className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm"
              />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm"
              >
                <option value="all">All tags</option>
                {tagOptions.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </header>

          <Card title="New Entry">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Title</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Tags (comma separated)</label>
                  <input
                    value={form.tags}
                    onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
                    placeholder="reflection, gratitude"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Entry</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-neutral-300">
                  <input
                    type="checkbox"
                    checked={form.encrypt}
                    onChange={e => setForm(prev => ({ ...prev, encrypt: e.target.checked }))}
                  />
                  Encrypt this entry
                </label>
                {form.encrypt && (
                  <input
                    type="password"
                    placeholder="Passphrase"
                    value={form.passphrase}
                    onChange={e => setForm(prev => ({ ...prev, passphrase: e.target.value }))}
                    className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm"
                  />
                )}
              </div>
              <div className="flex justify-end">
                <Button variant="primary" className={`text-xs ${saving ? 'opacity-60' : ''}`}>
                  {saving ? 'Saving…' : 'Save Entry'}
                </Button>
              </div>
            </form>
          </Card>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loading ? (
              <Card><div className="card-skeleton h-32" /></Card>
            ) : filteredNotes.length === 0 ? (
              <Card>
                <div className="text-sm text-neutral-400">No entries match that filter yet.</div>
              </Card>
            ) : (
              filteredNotes.map((note: NoteEntry) => {
                const encrypted = Boolean(note.attachments?.encrypted)
                const plaintext = encrypted ? decryptedMap[note.id] : note.content
                return (
                  <Card key={note.id} title={note.title || 'Untitled'}>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {note.tags?.map((tag: string) => (
                        <span key={tag} className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 uppercase tracking-wide text-neutral-400">
                          {tag}
                        </span>
                      ))}
                      {encrypted && (
                        <span className="text-[11px] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-200">
                          Encrypted
                        </span>
                      )}
                      {note.attachments?.mood && (
                        <span className="text-[11px] px-2 py-1 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-100">
                          Mood: {note.attachments.mood}
                        </span>
                      )}
                    </div>

                    {encrypted && !plaintext && (
                      <div className="space-y-3">
                        <p className="text-sm text-neutral-400">This note is encrypted. Enter your passphrase to decrypt.</p>
                        <input
                          type="password"
                          value={decryptInputs[note.id] ?? ''}
                          onChange={e => setDecryptInputs(prev => ({ ...prev, [note.id]: e.target.value }))}
                          placeholder="Passphrase"
                          className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        />
                        {decryptErrors[note.id] && <p className="text-xs text-red-400">{decryptErrors[note.id]}</p>}
                        <div className="flex gap-2">
                          <Button variant="primary" className="text-xs" onClick={() => handleDecrypt(note.id, note.content ?? '')}>Decrypt</Button>
                          <button className="text-xs text-red-300" onClick={() => deleteNote(note.id)}>Delete</button>
                        </div>
                      </div>
                    )}

                    {plaintext && (
                      <div className="prose prose-invert prose-sm mb-3 max-w-none">
                        <ReactMarkdown>{plaintext}</ReactMarkdown>
                      </div>
                    )}

                    {note.attachments?.aiSummary && (
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-neutral-200 mb-3">
                        <p className="text-xs uppercase text-neutral-400 mb-1">AI Summary</p>
                        <p>{note.attachments.aiSummary}</p>
                        {note.attachments.actionItems?.length > 0 && (
                          <ul className="mt-2 space-y-1 text-xs text-neutral-400 list-disc list-inside">
                            {note.attachments.actionItems.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <div className="flex flex-wrap gap-2">
                        {note.attachments?.keywords?.slice(0, 4).map((keyword: string) => (
                          <span key={keyword} className="px-2 py-1 rounded bg-black/40 border border-white/10">{keyword}</span>
                        ))}
                      </div>
                      <span>{note.updated_at ? new Date(note.updated_at).toLocaleDateString() : ''}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs">
                      <Button
                        variant="secondary"
                        className={`text-xs ${aiLoadingId === note.id ? 'opacity-50' : ''}`}
                        onClick={() => handleAnalyze(note)}
                      >
                        {aiLoadingId === note.id ? 'Analyzing…' : 'Run AI Analysis'}
                      </Button>
                      <button className="text-red-300" onClick={() => deleteNote(note.id)}>Delete</button>
                    </div>
                  </Card>
                )
              })
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
