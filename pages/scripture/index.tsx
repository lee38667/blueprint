import { useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useScriptureFavorites } from '../../hooks/useScriptureFavorites'
import { useToastStore } from '../../lib/toastStore'

export default function ScripturePage() {
  const { favorites, loading, addFavorite, removeFavorite } = useScriptureFavorites()
  const [searchReference, setSearchReference] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const toast = useToastStore()

  const handleSearch = async () => {
    if (!searchReference.trim()) {
      toast.error('Please enter a scripture reference (e.g., John 3:16)')
      return
    }

    setSearchLoading(true)
    try {
      // TODO: Wire up public Bible API (e.g., Bible.com API, ESV API)
      // For now, show placeholder
      toast.info('Bible API integration coming soon')
    } catch (error) {
      toast.error('Failed to fetch scripture')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (confirm('Remove this scripture from favorites?')) {
      await removeFavorite(id)
    }
  }

  return (
    <div className="flex h-screen bg-[#0a0a14] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-electric mb-2">📖 Scripture</h1>
              <p className="text-neutral-400">Search and save your favorite verses</p>
            </div>

            {/* Search Bar */}
            <Card className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchReference}
                  onChange={e => setSearchReference(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter reference (e.g., John 3:16, Psalm 23, Romans 8:28)"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-electric"
                />
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="text-sm"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </Card>

            {/* Favorites List */}
            <Card title={`💙 Favorites (${favorites.length})`}>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="card-skeleton h-24" />
                  ))}
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-500 mb-2">No favorite scriptures yet</p>
                  <p className="text-xs text-neutral-600">Search for verses above and save them to your favorites</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {favorites.map((fav: any) => (
                    <div
                      key={fav.id}
                      className="bg-black/30 border border-white/10 rounded-lg p-4 hover:border-electric/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-electric mb-2">
                            {fav.reference}
                          </h3>
                          <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                            "{fav.text}"
                          </p>
                          {fav.translation && (
                            <p className="text-xs text-neutral-500">
                              {fav.translation}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(fav.id)}
                          className="text-neutral-500 hover:text-red-400 transition-colors"
                          aria-label="Remove favorite"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {fav.notes && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-neutral-400">{fav.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
