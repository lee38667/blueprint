import { useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useScriptureFavorites } from '../../hooks/useScriptureFavorites'
import { useToastStore } from '../../lib/toastStore'
import { useConfirm } from '../../hooks/useConfirm'
import { Icons } from '../../components/icons'
import { CardSkeleton } from '../../components/Skeleton'

export default function ScripturePage() {
  const { favorites, loading, addFavorite, removeFavorite } = useScriptureFavorites()
  const { confirm, confirmDialog } = useConfirm()
  const [searchReference, setSearchReference] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<{ passages: string[]; canonical: string } | null>(null)
  const toast = useToastStore()

  const handleSearch = async () => {
    if (!searchReference.trim()) {
      toast.error('Please enter a scripture reference (e.g., John 3:16)')
      return
    }
    setSearchLoading(true)
    setSearchResult(null)
    try {
      const response = await fetch(`/api/scripture/search?reference=${encodeURIComponent(searchReference)}`)
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Failed to fetch scripture')
        return
      }
      setSearchResult(data)
      toast.success('Scripture loaded!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch scripture')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAddToFavorites = async () => {
    if (!searchResult) return
    try {
      const result = await addFavorite({
        reference: searchResult.canonical,
        verse: searchResult.passages[0],
      })
      if (result.error) {
        toast.error('Failed to save favorite')
      } else {
        toast.success('Added to favorites!')
        setSearchResult(null)
        setSearchReference('')
      }
    } catch {
      toast.error('Failed to save favorite')
    }
  }

  const handleRemove = async (id: string) => {
    const confirmed = await confirm({
      title: 'Remove Favorite?',
      message: 'Remove this scripture from favorites?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    })
    if (confirmed) {
      await removeFavorite(id)
      toast.success('Removed from favorites')
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        <ConfirmDialog {...confirmDialog} />

        <div className="mb-6">
          <h1 className="heading-xl mb-2">Scripture</h1>
          <p style={{ color: 'var(--theme-text-muted)' }} className="text-sm">Search and save your favorite verses</p>
        </div>

        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={searchReference}
              onChange={(e) => setSearchReference(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter reference (e.g., John 3:16, Psalm 23)"
              className="input-base flex-1"
            />
            <Button variant="primary" onClick={handleSearch} disabled={searchLoading} className="text-sm">
              {searchLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {searchResult && (
            <div className="rounded-lg p-4" style={{ background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-accent) 30%, transparent)' }}>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-accent)' }}>{searchResult.canonical}</h3>
                <Button variant="secondary" onClick={handleAddToFavorites} className="text-xs">Add to Favorites</Button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--theme-text-dim)' }}>{searchResult.passages[0]}</p>
              <p className="text-xs mt-3" style={{ color: 'var(--theme-text-muted)' }}>ESV - English Standard Version</p>
            </div>
          )}
        </Card>

        <Card title={`Favorites (${favorites.length})`}>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <CardSkeleton key={i} className="h-24" />)}
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: 'var(--theme-text-muted)' }} className="mb-2">No favorite scriptures yet</p>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Search for verses above and save them</p>
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map((fav: any) => (
                <div key={fav.id} className="rounded-lg p-4 transition-all" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-accent)' }}>{fav.reference}</h3>
                      <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap" style={{ color: 'var(--theme-text-dim)' }}>&ldquo;{fav.verse}&rdquo;</p>
                      {fav.translation && <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{fav.translation}</p>}
                    </div>
                    <button onClick={() => handleRemove(fav.id)} className="transition-colors" style={{ color: 'var(--theme-text-muted)' }} aria-label="Remove favorite">
                      <Icons.Trash />
                    </button>
                  </div>
                  {fav.notes && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--theme-border)' }}>
                      <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{fav.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}
