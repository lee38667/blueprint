import { useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { CardSkeleton } from '../../components/Skeleton'
import { useSkills } from '../../hooks/useSkills'
import { useConfirm } from '../../hooks/useConfirm'
import type { Skill } from '../../types/models'

const INITIAL_FORM = {
  name: '',
  level: '1',
  kind: 'general',
  description: '',
}

type SortMode = 'level' | 'name'

export default function SkillsPage() {
  const { skills, loading, error, addSkill, updateSkill, deleteSkill } = useSkills()
  const { confirm, confirmDialog } = useConfirm()
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterKind, setFilterKind] = useState('all')
  const [sortMode, setSortMode] = useState<SortMode>('level')
  const [saving, setSaving] = useState(false)

  const kindOptions = useMemo(() => {
    const values = new Set(skills.map((skill) => skill.kind || 'general'))
    values.add('general')
    return Array.from(values).sort()
  }, [skills])

  const visibleSkills = useMemo(() => {
    const filtered = filterKind === 'all' ? skills : skills.filter((skill) => (skill.kind || 'general') === filterKind)
    return [...filtered].sort((a, b) => {
      if (sortMode === 'name') return (a.name || '').localeCompare(b.name || '')
      return (b.level || 0) - (a.level || 0) || (a.name || '').localeCompare(b.name || '')
    })
  }, [filterKind, skills, sortMode])

  const editingSkill = editingId ? skills.find((skill) => skill.id === editingId) : null

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setEditingId(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name,
      level: Math.min(100, Math.max(1, parseInt(form.level, 10) || 1)),
      kind: form.kind || 'general',
      description: form.description || null,
    }
    if (editingId) {
      await updateSkill(editingId, payload)
    } else {
      await addSkill(payload)
    }
    setSaving(false)
    resetForm()
  }

  const startEdit = (skill: Skill) => {
    setEditingId(skill.id)
    setForm({
      name: skill.name || '',
      level: String(skill.level || 1),
      kind: skill.kind || 'general',
      description: skill.description || '',
    })
  }

  const handleDelete = async (skill: Skill) => {
    const confirmed = await confirm({
      title: 'Delete Skill?',
      message: `Delete "${skill.name}" from your skill tracker?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    })
    if (confirmed) await deleteSkill(skill.id)
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 py-4">
        <ConfirmDialog {...confirmDialog} />
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="heading-xl">Skills</h1>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Track capability growth, evidence, and development focus areas.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={filterKind} onChange={(event) => setFilterKind(event.target.value)} className="input-base">
              <option value="all">All kinds</option>
              {kindOptions.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
            </select>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="input-base">
              <option value="level">Sort by level</option>
              <option value="name">Sort by name</option>
            </select>
          </div>
        </header>

        <Card title={editingSkill ? `Edit ${editingSkill.name}` : 'Add Skill'}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Name</label>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="input-base w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Level</label>
              <input value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} type="number" min={1} max={100} className="input-base w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Kind</label>
              <input value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))} className="input-base w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Description</label>
              <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="input-base w-full" />
            </div>
            <div className="md:col-span-6 flex justify-end gap-2">
              {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
              <Button type="submit" variant="primary" loading={saving}>{editingId ? 'Save Skill' : 'Add Skill'}</Button>
            </div>
          </form>
        </Card>

        {error && <div className="text-sm text-red-400">{error}</div>}

        {loading ? (
          <Card><CardSkeleton className="h-24" /></Card>
        ) : visibleSkills.length === 0 ? (
          <Card>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No skills match the current filter.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleSkills.map((skill) => (
              <Card key={skill.id} title={skill.name || 'Untitled Skill'} subtitle={skill.kind || 'general'}>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-end justify-between text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>
                      <span>Level</span>
                      <span className="font-mono">{skill.level || 1}/100</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'var(--theme-surface)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(1, skill.level || 1))}%`, background: 'var(--theme-accent)' }} />
                    </div>
                  </div>
                  {skill.description && <p className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>{skill.description}</p>}
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(skill)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(skill)}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
