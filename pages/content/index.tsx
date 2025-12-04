import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useContentLibrary } from '../../hooks/useContentLibrary'
import { supabase } from '../../lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function ContentPage(){
  const { items, loading } = useContentLibrary()
  const [files, setFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<File|null>(null)

  useEffect(()=>{
    const load = async () => {
      const { data } = await supabase.storage.from('documents').list('', { limit: 100 })
      setFiles(data ?? [])
    }
    load()
  },[])

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selected) return
    setUploading(true)
    const path = `${Date.now()}_${selected.name}`
    const { error } = await supabase.storage.from('documents').upload(path, selected, { cacheControl: '3600', upsert: false })
    if (!error) {
      const { data } = await supabase.storage.from('documents').list('')
      setFiles(data ?? [])
      setSelected(null)
    }
    setUploading(false)
  }

  const getPublicUrl = (name: string) => {
    const { data } = supabase.storage.from('documents').getPublicUrl(name)
    return data.publicUrl
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6 space-y-6">
          <h1 className="text-2xl font-display font-bold">Documents Vault</h1>
          <Card title="Upload">
            <form onSubmit={handleUpload} className="flex items-end gap-3">
              <input type="file" onChange={e=> setSelected(e.target.files?.[0] ?? null)} className="text-sm" />
              <Button variant="primary" className={`text-xs ${uploading? 'opacity-60':''}`}>{uploading? 'Uploading…' : 'Upload'}</Button>
            </form>
            <div className="text-xs subtle-muted mt-2">Ensure a Supabase Storage bucket named <code>documents</code> exists.</div>
          </Card>
          <Card title="Library">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {files.map(f => (
                <div key={f.name} className="p-3 rounded-xl border border-white/10 bg-white/5">
                  <div className="font-medium text-sm">{f.name}</div>
                  <div className="text-xs text-neutral-500">{Math.round((f.metadata?.size ?? 0)/1024)} KB</div>
                  <div className="mt-2 flex gap-2">
                    <a href={getPublicUrl(f.name)} target="_blank" rel="noreferrer" className="btn-glow px-3 py-1 rounded text-xs">Open</a>
                  </div>
                </div>
              ))}
              {files.length === 0 && <div className="subtle-muted">No documents yet.</div>}
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
