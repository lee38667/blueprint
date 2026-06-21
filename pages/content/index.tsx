import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useContentLibrary } from '../../hooks/useContentLibrary'
import { supabase } from '../../lib/supabaseClient'
import { authedFetch } from '../../lib/apiClient'
import { useToastStore } from '../../lib/toastStore'
import { CardSkeleton } from '../../components/Skeleton'
import { useMemo, useState } from 'react'
import type { DocumentItem } from '../../types/models'

const DOC_TYPES = [
  { label: 'General Document', value: 'general' },
  { label: 'CV / Resume', value: 'cv' },
  { label: 'Certificate', value: 'certificate' },
  { label: 'Reference Material', value: 'reference' },
]

const SHARE_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 24 * 7 },
]

async function readSnippet(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      resolve(text.slice(0, 4000))
    }
    reader.onerror = () => resolve('')
    reader.readAsText(file)
  })
}

export default function ContentPage() {
  const { items, loading, addRecord, updateMetadata } = useContentLibrary()
  const toast = useToastStore()
  const [selected, setSelected] = useState<File | null>(null)
  const [docType, setDocType] = useState('general')
  const [context, setContext] = useState('')
  const [uploading, setUploading] = useState(false)
  const [shareTarget, setShareTarget] = useState<string | null>(null)

  const cvHistory = useMemo(() => {
    return items
      .filter((item) => item.type === 'cv')
      .sort((a, b) => (b.metadata?.version ?? 0) - (a.metadata?.version ?? 0))
  }, [items])

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selected) return
    setUploading(true)
    try {
      const path = `documents/${Date.now()}_${selected.name}`
      const { error } = await supabase.storage.from('documents').upload(path, selected, { upsert: false })
      if (error) throw error

      const snippet = await readSnippet(selected)
      const summaryRes = await authedFetch('/api/documents/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: selected.name, snippet, context }),
      })
      const summaryJson = await summaryRes.json().catch(() => ({}))

      const version =
        docType === 'cv'
          ? Math.max(0, ...items.filter((i) => i.type === 'cv').map((i) => i.metadata?.version ?? 0)) + 1
          : null

      await addRecord({
        title: selected.name,
        type: docType,
        metadata: {
          path,
          bucket: 'documents',
          size: selected.size,
          uploadedAt: new Date().toISOString(),
          version,
          summary: summaryJson.summary ?? 'Summary pending',
          talkingPoints: summaryJson.talkingPoints ?? [],
          keywords: summaryJson.keywords ?? [],
          shareLinks: [],
        },
      })
      setSelected(null)
      setContext('')
      setDocType('general')
      toast.success('Document uploaded successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const openDoc = (item: DocumentItem) => {
    const path = item.metadata?.path
    if (!path) return
    const { data } = supabase.storage.from('documents').getPublicUrl(path)
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank')
    }
  }

  const handleShare = async (item: DocumentItem, hours: number) => {
    if (!item.metadata?.path) return
    setShareTarget(`${item.id}-${hours}`)
    try {
      const { data, error } = await supabase
        .storage
        .from(item.metadata.bucket ?? 'documents')
        .createSignedUrl(item.metadata.path, hours * 3600)
      if (error) throw error
      const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString()
      const shareLinks = [...(item.metadata?.shareLinks ?? []), { url: data?.signedUrl, expiresAt, hours }]
      await updateMetadata(item, { shareLinks })
      toast.success('Share link created')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create share link')
    } finally {
      setShareTarget(null)
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 py-4">
        <header>
          <h1 className="heading-xl">Documents Vault</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Upload once, auto-summarize, share securely, and keep a CV history trail.
          </p>
        </header>

        <Card title="Upload & Summarize">
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Select file</label>
              <input type="file" onChange={(e) => setSelected(e.target.files?.[0] ?? null)} className="text-sm" style={{ color: 'var(--theme-text-dim)' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Document type</label>
              <select className="input-base w-full" value={docType} onChange={(e) => setDocType(e.target.value)}>
                {DOC_TYPES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Context for AI summary (optional)</label>
              <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3} className="input-base w-full" placeholder="What should the AI pay attention to?" />
            </div>
            <div className="flex justify-end md:col-span-2">
              <Button variant="primary" className={`text-xs ${uploading ? 'opacity-60' : ''}`} type="submit">
                {uploading ? 'Uploading...' : 'Upload & Summarize'}
              </Button>
            </div>
          </form>
        </Card>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {loading ? (
            <Card><CardSkeleton className="h-32" /></Card>
          ) : items.length === 0 ? (
            <Card><p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No documents uploaded yet.</p></Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} title={item.title ?? 'Untitled'}>
                <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                  <span className="badge">{item.type}</span>
                  {item.metadata?.version && <span className="badge" style={{ color: 'var(--theme-accent)' }}>v{item.metadata.version}</span>}
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--theme-text-dim)' }}>{item.metadata?.summary || 'Summary pending...'}</p>
                {item.metadata?.talkingPoints?.length > 0 && (
                  <ul className="text-xs space-y-1 mb-3 list-disc list-inside" style={{ color: 'var(--theme-text-muted)' }}>
                    {item.metadata?.talkingPoints?.map((point: string, idx: number) => <li key={idx}>{point}</li>)}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2 text-xs mb-3">
                  {item.metadata?.keywords?.slice(0, 5).map((keyword: string) => (
                    <span key={keyword} className="badge">{keyword}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 text-xs mb-4">
                  <Button variant="secondary" className="text-xs" onClick={() => openDoc(item)}>Open</Button>
                  {SHARE_OPTIONS.map((opt) => {
                    const shareKey = `${item.id}-${opt.hours}`
                    return (
                      <button key={opt.hours} onClick={() => handleShare(item, opt.hours)} className={`px-3 py-1 rounded-full ${shareTarget === shareKey ? 'opacity-40' : ''}`} style={{ border: '1px solid var(--theme-border)' }}>
                        Share {opt.label}
                      </button>
                    )
                  })}
                </div>
                {item.metadata?.shareLinks?.length > 0 && (
                  <div className="rounded-xl p-3 text-xs space-y-2" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                    <p className="uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>Recent share links</p>
                    {item.metadata?.shareLinks?.slice(-3).reverse().map((link: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <a className="truncate" style={{ color: 'var(--theme-accent)' }} href={link.url} target="_blank" rel="noreferrer">{link.url}</a>
                        <span style={{ color: 'var(--theme-text-muted)' }}>Expires {new Date(link.expiresAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </section>

        {cvHistory.length > 0 && (
          <Card title="CV Version History">
            <div className="space-y-3">
              {cvHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm rounded-xl p-3" style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--theme-text)' }}>{item.title}</p>
                    <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      Version {item.metadata?.version} &bull; Uploaded {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-xs" style={{ color: 'var(--theme-accent)' }} onClick={() => openDoc(item)}>View</button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}
