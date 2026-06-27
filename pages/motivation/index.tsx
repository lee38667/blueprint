import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useMotivationBoard } from '../../hooks/useMotivationBoard'
import { useConfirm } from '../../hooks/useConfirm'
import { CardSkeleton } from '../../components/Skeleton'
import UnsplashPicker from '../../components/UnsplashPicker'
import type { UnsplashPhoto } from '../../hooks/useUnsplash'
import { useState } from 'react'

export default function MotivationPage() {
  const { items, loading, addItem, removeItem } = useMotivationBoard()
  const { confirm, confirmDialog } = useConfirm()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const handlePickImage = async (photo: UnsplashPhoto) => {
    // Store the image with the photographer attribution Unsplash's terms require.
    await addItem({
      kind: 'image',
      image_url: photo.regular,
      title: title || photo.alt,
      body: `Photo by ${photo.photographer} on Unsplash`,
    })
    setTitle('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title && !body) return
    await addItem({ title, body, kind: 'quote' })
    setTitle('')
    setBody('')
  }

  const handleRemove = async (id: string) => {
    const confirmed = await confirm({
      title: 'Remove Item?',
      message: 'Are you sure you want to remove this inspiration?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    })
    if (confirmed) {
      await removeItem(id)
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        <ConfirmDialog {...confirmDialog} />
        <h1 className="heading-xl">Motivation Board</h1>

        <Card title="Add Inspiration">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title or quote" className="input-base w-full" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Optional longer note" rows={3} className="input-base w-full" />
            <Button variant="primary" className="text-xs w-full" type="submit">Save</Button>
          </form>

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--theme-text-muted)' }}>
              …or add an image from Unsplash (uses the title above as a caption):
            </p>
            <UnsplashPicker onPick={handlePickImage} />
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {loading ? (
            <Card><CardSkeleton className="h-24" /></Card>
          ) : items.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col gap-2">
                {item.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt={item.title ?? 'Inspiration'} className="w-full rounded-lg object-cover max-h-56" />
                )}
                {item.title && <div className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{item.title}</div>}
                {item.body && <div className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>{item.body}</div>}
                <button onClick={() => handleRemove(item.id)} className="mt-2 text-[11px] self-start hover:text-red-400 transition-colors" style={{ color: 'var(--theme-text-muted)' }}>
                  Remove
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  )
}
