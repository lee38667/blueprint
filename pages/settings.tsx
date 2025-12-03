import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import { useStore } from '../lib/store'

export default function SettingsPage(){
  const accent = useStore(s=> s.accentColor)
  const setAccent = useStore(s=> s.setAccentColor)
  const animations = useStore(s=> s.animationsEnabled)
  const setAnimations = useStore(s=> s.setAnimationsEnabled)
  const fontSize = useStore(s=> s.baseFontSize)
  const setFontSize = useStore(s=> s.setBaseFontSize)

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6 space-y-6 max-w-5xl mx-auto">
          <h1 className="text-2xl font-display font-bold">Settings</h1>
          <Card title="Profile">
            <div className="text-sm text-neutral-400">Profile customization coming soon.</div>
          </Card>
          <Card title="Theme">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-neutral-400 mb-2">Accent Color</div>
                <div className="flex gap-2">
                  {['electric','neon','teal'].map(c => (
                    <button key={c} onClick={()=>setAccent(c)} className={`w-8 h-8 rounded-full border ${accent===c? 'ring-2 ring-white/50':''}`} style={{ background:
                      c==='electric' ? '#00E5FF' : c==='neon' ? '#B300FF' : '#14B8A6' }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-neutral-400">Animations</div>
                  <div className="text-xs subtle-muted">Toggle framer-motion micro-interactions.</div>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={animations} onChange={e=>setAnimations(e.target.checked)} />
                  <span className="text-sm">Enabled</span>
                </label>
              </div>
              <div>
                <div className="text-sm text-neutral-400 mb-2">Base Typography Size</div>
                <input type="range" min={14} max={18} value={fontSize} onChange={e=>setFontSize(parseInt(e.target.value))} />
                <div className="text-xs subtle-muted mt-1">{fontSize}px</div>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
