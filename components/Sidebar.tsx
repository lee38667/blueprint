import Link from 'next/link'
import { useStore } from '../lib/store'

export default function Sidebar(){
  const collapsed = useStore(s=> s.sidebarCollapsed)

  return (
    <aside className={`h-screen p-4 bg-gray-900 ${collapsed ? 'w-16' : 'w-64'} transition-width`}> 
      <div className="mb-6 text-xl font-bold">Blueprint</div>
      <nav className="space-y-2">
        <Link href="/dashboard"><a className="block p-2 rounded hover:bg-gray-800">Dashboard</a></Link>
        <Link href="/notes"><a className="block p-2 rounded hover:bg-gray-800">Notes</a></Link>
        <Link href="/life-areas"><a className="block p-2 rounded hover:bg-gray-800">Life Areas</a></Link>
        <Link href="/gym"><a className="block p-2 rounded hover:bg-gray-800">Gym</a></Link>
        <Link href="/finance"><a className="block p-2 rounded hover:bg-gray-800">Finance</a></Link>
        <Link href="/skills"><a className="block p-2 rounded hover:bg-gray-800">Skills</a></Link>
        <Link href="/content"><a className="block p-2 rounded hover:bg-gray-800">Content</a></Link>
        <Link href="/settings"><a className="block p-2 rounded hover:bg-gray-800">Settings</a></Link>
      </nav>
    </aside>
  )
}
