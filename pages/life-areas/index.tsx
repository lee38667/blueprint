import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useLifeArea } from '../../hooks/useLifeArea'
import { useState } from 'react'

export default function LifeAreasPage(){
  const { areas, loading, error, addArea, updateArea, deleteArea } = useLifeArea()
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
    if (confirm('Delete this life area?')) {
      await deleteArea(id)
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-display font-bold">Life Areas</h1>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>

          <Card title="Add Life Area">
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Area Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Health, Career, Relationships"
                  className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What does this area encompass?"
                  rows={2}
                  className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
                />
              </div>
              <Button variant="primary" className="text-xs w-full">Create Area</Button>
            </form>
          </Card>

          <Card title="Your Life Areas">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {loading ? (
                <div className="card-skeleton h-24" />
              ) : areas.length === 0 ? (
                <p className="text-sm text-neutral-500 col-span-full">No life areas yet. Create one above.</p>
              ) : (
                areas.map(area => (
                  <div key={area.id} className="p-4 rounded-lg border border-white/10 bg-white/5">
                    {editingId === area.id ? (
                      <div className="space-y-2">
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full rounded bg-black/40 border border-white/10 px-2 py-1 text-sm"
                        />
                        <textarea
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          rows={2}
                          className="w-full rounded bg-black/40 border border-white/10 px-2 py-1 text-sm text-xs"
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1 rounded border border-white/10">Cancel</button>
                          <button onClick={handleEditSave} className="text-xs px-3 py-1 rounded btn-glow">Save</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-medium text-sm">{area.name}</h3>
                        <p className="text-xs text-neutral-400 mt-1">{area.description || 'No description'}</p>
                        <div className="flex gap-2 mt-3 justify-end">
                          <button onClick={() => handleEditStart(area)} className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/5">Edit</button>
                          <button onClick={() => handleDelete(area.id)} className="text-xs px-2 py-1 rounded border border-red-900/50 text-red-400 hover:bg-red-900/20">Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
