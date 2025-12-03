import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import DemoOne from '@/components/ui/demo'

export default function DemoCircularPage() {
  return (
    <div className="min-h-screen flex bg-black text-white font-sans selection:bg-electric selection:text-black">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-display font-bold">Circular Command Menu Demo</h1>
            </div>

            <div className="p-6 bg-white/5 rounded">
              <p className="text-sm text-gray-400 mb-4">This demonstrates the circular command menu component.</p>
              <DemoOne />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
