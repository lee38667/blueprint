import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useLifeArea } from '../../hooks/useLifeArea'
import { useGoals } from '../../hooks/useGoals'
import { useConfirm } from '../../hooks/useConfirm'
import { CardSkeleton } from '../../components/Skeleton'
import { useMemo, useState } from 'react'

const AREA_PRESETS: { label: string; emoji: string }[] = [
  { label: 'Health', emoji: '🫀' },
  { label: 'Career', emoji: '💼' },
  { label: 'Relationships', emoji: '🤝' },
  { label: 'Finance', emoji: '💰' },
  { label: 'Mind', emoji: '🧠' },
  { label: 'Faith', emoji: '✝️' },
  { label: 'Creative', emoji: '🎨' },
  { label: 'Adventure', emoji: '🧭' },
]

function inferEmoji(name: string): string {
  const lower = name.toLowerCase()
  const hit = AREA_PRESETS.find((preset) => lower.includes(preset.label.toLowerCase()))
  if (hit) return hit.emoji
  return '◆'
}

function progressColor(percent: number): string {
  if (percent >= 75) return '#10b981'
  if (percent >= 40) return 'var(--theme-accent)'
  if (percent > 0) return '#f59e0b'
  return 'var(--theme-border)'
}

export default function LifeAreasPage() {
  const { areas, loading, error, addArea, updateArea, deleteArea } = useLifeArea()
  const { goals } = useGoals()
  const { confirm, confirmDialog } = useConfirm()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const areaSummaries = useMemo(() => {
    return areas.map((area) => {
      const lower = area.name.toLowerCase()
      const matched = goals.filter((goal) => (goal.category || '').toLowerCase().includes(lower))
      const active = matched.filter((g) => g.status === 'active' || g.status === 'in_progress' || !g.status).length
      const completed = matched.filter((g) => g.status === 'completed' || g.status === 'done').length
      const total = matched.length
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0
      return { area, matched, active, completed, total, percent }
    })
  }, [areas, goals])

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return
    const finalEmoji = emoji.trim() || inferEmoji(name)
    const finalName = `${finalEmoji} ${name.trim()}`
    await addArea({ name: finalName, description: description || null })
    setName('')
    setDescription('')
    setEmoji('')
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

  const handleDelete = async (area: any) => {
    const confirmed = await confirm({
      title: 'Delete Life Area?',
      message: `Remove "${area.name}" from your life areas?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    })
    if (confirmed) await deleteArea(area.id)
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 py-4">
        <ConfirmDialog {...confirmDialog} />

        <header>
          <h1 className="heading-xl">Life Areas</h1>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            The big categories your goals roll up into. Match a goal's <em>category</em> field to an area name to see it appear here.
          </p>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </header>

        <Card title="Add Life Area" subtitle="Pick a preset or invent your own.">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {AREA_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => { setName(preset.label); setEmoji(preset.emoji) }}
                  className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-dim)' }}
                >
                  <span>{preset.emoji}</span>
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[60px_1fr] gap-2">
              <input value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 4))} placeholder="◆" className="input-base text-center" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Area name" className="input-base w-full" />
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this area encompass? Why does it matter?" rows={2} className="input-base w-full" />
            <div className="flex justify-end">
              <Button variant="primary" type="submit">Create Area</Button>
            </div>
          </form>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <Card><CardSkeleton className="h-32" /></Card>
          ) : areaSummaries.length === 0 ? (
            <Card><p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No life areas yet. Add one to start mapping your focus.</p></Card>
          ) : (
            areaSummaries.map(({ area, matched, active, completed, total, percent }) => (
              <div key={area.id} className="panel-glass rounded-2xl p-5 flex flex-col gap-3">
                {editingId === area.id ? (
                  <div className="space-y-2">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input-base w-full" />
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="input-base w-full" />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button size="sm" variant="primary" onClick={handleEditSave}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--theme-text)' }}>
                        {area.name}
                      </h3>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Progress</div>
                        <div className="font-mono text-base" style={{ color: progressColor(percent) }}>{percent}%</div>
                      </div>
                    </div>
                    {area.description && (
                      <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{area.description}</p>
                    )}

                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-surface)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: progressColor(percent) }} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs"
                      style={{ borderTop: '1px solid var(--theme-border)', borderBottom: '1px solid var(--theme-border)' }}>
                      <div className="py-2">
                        <div style={{ color: 'var(--theme-text-muted)' }}>Active</div>
                        <div className="font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>{active}</div>
                      </div>
                      <div className="py-2" style={{ borderLeft: '1px solid var(--theme-border)', borderRight: '1px solid var(--theme-border)' }}>
                        <div style={{ color: 'var(--theme-text-muted)' }}>Done</div>
                        <div className="font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>{completed}</div>
                      </div>
                      <div className="py-2">
                        <div style={{ color: 'var(--theme-text-muted)' }}>Total</div>
                        <div className="font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>{total}</div>
                      </div>
                    </div>

                    {matched.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Linked goals</div>
                        {matched.slice(0, 4).map((goal) => (
                          <div key={goal.id} className="flex items-center justify-between gap-2 text-xs rounded px-2 py-1"
                            style={{ background: 'var(--theme-surface)' }}>
                            <span className="truncate" style={{ color: 'var(--theme-text-dim)' }}>{goal.title}</span>
                            <span className="text-[10px] uppercase" style={{ color: 'var(--theme-text-muted)' }}>{goal.status || 'active'}</span>
                          </div>
                        ))}
                        {matched.length > 4 && (
                          <div className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>+{matched.length - 4} more</div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-auto pt-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditStart(area)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(area)}>Delete</Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
