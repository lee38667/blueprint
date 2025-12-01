import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import { useNotes } from '../../hooks/useNotes'
import dynamic from 'next/dynamic'
import { useState } from 'react'

const ReactMarkdown = dynamic(() => import('react-markdown'))

export default function NotesPage() {
  const { notes, loading } = useNotes()
  const [query, setQuery] = useState('')

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl">Notes</h1>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" className="p-2 rounded bg-gray-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <Card><div className="card-skeleton h-24" /></Card>
            ) : (
              notes.map((n: any) => (
                <Card key={n.id} title={n.title}>
                  <ReactMarkdown>{n.content}</ReactMarkdown>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
