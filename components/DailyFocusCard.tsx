import Card from './Card'
import Button from './Button'

export default function DailyFocusCard(){
  return (
    <Card className="border-accent relative overflow-hidden group">
      {/* Background Glow — tinted to the active theme accent */}
      <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" style={{ background: 'color-mix(in srgb, var(--theme-accent) 8%, transparent)' }} />

      <div className="flex flex-col h-full justify-between relative z-10">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold tracking-wide uppercase flex items-center gap-2 text-[var(--theme-text)]">
              <span className="text-accent">{"///"}</span> Command
            </h3>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-mono uppercase tracking-wider text-accent">Active</span>
               <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider font-mono text-[var(--theme-text-muted)]">Primary Objective</p>
            <p className="text-2xl font-medium tracking-tight leading-tight text-[var(--theme-text)]">Build better habits</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <Button variant="primary" className="w-full justify-center font-bold">
            Complete
          </Button>
          <Button variant="outline" className="w-full justify-center">
            Defer
          </Button>
        </div>
      </div>
    </Card>
  )
}
