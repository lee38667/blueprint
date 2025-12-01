import Card from './Card'
import Button from './Button'

export default function DailyFocusCard(){
  return (
    <Card className="!bg-off-black border-electric/40 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-electric/5 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
      
      <div className="flex flex-col h-full justify-between relative z-10">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="text-electric">///</span> Command
            </h3>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-mono text-electric/70 uppercase tracking-wider">Active</span>
               <div className="h-1.5 w-1.5 rounded-full bg-electric animate-pulse shadow-[0_0_10px_#00E5FF]" />
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">Primary Objective</p>
            <p className="text-2xl text-white font-medium tracking-tight leading-tight">Build better habits</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <Button variant="primary" className="w-full justify-center !bg-electric hover:!bg-electric/90 !text-black font-bold shadow-[0_0_20px_rgba(0,229,255,0.3)]">
            Complete
          </Button>
          <Button variant="outline" className="w-full justify-center !border-white/20 hover:!border-white/40 text-gray-300">
            Defer
          </Button>
        </div>
      </div>
    </Card>
  )
}
