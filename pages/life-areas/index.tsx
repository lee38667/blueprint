import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useLifeArea } from '../../hooks/useLifeArea'
import { useConfirm } from '../../hooks/useConfirm'
import { CardSkeleton } from '../../components/Skeleton'
import { useState } from 'react'

export default function LifeAreasPage() {
  const { areas, loading, error, addArea, updateArea, deleteArea } = useLifeArea()
  const { confirm, confirmDialog } = useConfirm()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return
    await addArea({ name, description: description || null })
    setName('')
    setDescription('')
  }

  const handleEditStart = (area: any) => {
    setEditingId(area.id)
    setEditName(area.name)
    setEditDescription(area.description || '')
  }

  const handleEditSave = async () => {
    if (!editName.trim()) return
    await updateArea(editingId!, { name: editName, description: editDescription || null })
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Life Area?',
      message: 'Are you sure you want to delete this life area?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    })
    if (confirmed) {
      await deleteArea(id)
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        <ConfirmDialog {...confirmDialog} />
        <div>
          <h1 className="heading-xl">Life Areas</h1>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        <Card title="Add Life Area">
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Area Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Health, Career, Relationships" className="input-base w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this area encompass?" rows={2} className="input-base w-full" />
            </div>
            <Button variant="primary" className="text-xs w-full" type="submit">Create Area</Button>
          </form>
        </Card>

        <Card title="Your Life Areas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {loading ? (
              <CardSkeleton className="h-24" />
            ) : areas.length === 0 ? (
              <p className="text-sm col-span-full" style={{ color: 'var(--theme-text-muted)' }}>No life areas yet. Create one above.</p>
            ) : (
              areas.map((area) => (
                <div key={area.id} className="p-4 rounded-lg" style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}>
                  {editingId === area.id ? (
                    <div className="space-y-2">
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input-base w-full" />
                      <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} className="input-base w-full" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1 rounded" style={{ border: '1px solid var(--theme-border)' }}>Cancel</button>
                        <button onClick={handleEditSave} className="text-xs px-3 py-1 rounded btn-accent">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-sm" style={{ color: 'var(--theme-text)' }}>{area.name}</h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>{area.description || 'No description'}</p>
                      <div className="flex gap-2 mt-3 justify-end">
                        <button onClick={() => handleEditStart(area)} className="text-xs px-2 py-1 rounded hover:bg-[var(--theme-surface-hover)]" style={{ border: '1px solid var(--theme-border)' }}>Edit</button>
                        <button onClick={() => handleDelete(area.id)} className="text-xs px-2 py-1 rounded border border-red-900/50 text-red-400 hover:bg-red-900/20">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
