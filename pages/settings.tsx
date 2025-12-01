import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { useStore } from '../lib/store'

export default function SettingsPage(){
  const toggleDark = useStore((s)=> s.toggleDarkMode)

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl mb-4">Settings</h1>
          <div className="space-y-4">
            <div className="p-4 bg-gray-900 rounded">
              <label className="flex items-center gap-4">
                <input type="checkbox" onChange={toggleDark} checked />
                <span>Dark Mode</span>
              </label>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
