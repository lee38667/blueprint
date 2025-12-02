import Link from 'next/link'
import Image from 'next/image'
import { useStore } from '../lib/store'
import { useRouter } from 'next/router'

const NavItem = ({ href, label, icon, collapsed }: { href: string; label: string; icon: React.ReactNode; collapsed: boolean }) => {
  const router = useRouter()
  const isActive = router.pathname.startsWith(href)
  
  return (
    <Link href={href} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-electric/10 text-electric' : 'text-minimal-gray hover:bg-white/5 hover:text-white'}`}>
      <div className={`${isActive ? 'text-electric drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]' : 'text-gray-400 group-hover:text-white'}`}>
        {icon}
      </div>
      {!collapsed && <span className="font-medium tracking-wide text-sm">{label}</span>}
    </Link>
  )
}

// Simple SVG icons
const Icons = {
  Dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Notes: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  LifeAreas: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
  Gym: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h11"></path><path d="M6.5 17.5h11"></path><path d="M6 20v-2a6 6 0 0 1 12 0v2"></path><path d="M6 4v2a6 6 0 0 1 12 0V4"></path></svg>,
  Finance: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  Skills: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
  Content: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  Settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
}

export default function Sidebar(){
  const collapsed = useStore(s=> s.sidebarCollapsed)

  return (
    <aside className={`h-screen p-4 bg-black/40 backdrop-blur-md border-r border-white/5 ${collapsed ? 'w-20' : 'w-64'} transition-all duration-300 flex flex-col`}> 
      <div className={`mb-8 flex items-center ${collapsed ? 'justify-center' : 'px-2'}`}>
        <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,229,255,0.35)] bg-black">
          <Image src="/logo.png" alt="Blueprint logo" fill className="object-contain" priority />
        </div>
        {!collapsed && <span className="ml-3 text-xl font-display font-bold tracking-wider text-white">BLUEPRINT</span>}
      </div>
      
      <nav className="space-y-2 flex-1">
        <NavItem href="/dashboard" label="Dashboard" icon={Icons.Dashboard} collapsed={collapsed} />
        <NavItem href="/motivation" label="Motivation" icon={Icons.Content} collapsed={collapsed} />
        <NavItem href="/goals" label="Goals" icon={Icons.LifeAreas} collapsed={collapsed} />
        <NavItem href="/notes" label="Notes" icon={Icons.Notes} collapsed={collapsed} />
        <NavItem href="/life-areas" label="Life Areas" icon={Icons.LifeAreas} collapsed={collapsed} />
        <NavItem href="/gym" label="Gym" icon={Icons.Gym} collapsed={collapsed} />
        <NavItem href="/finance" label="Finance" icon={Icons.Finance} collapsed={collapsed} />
        <NavItem href="/skills" label="Skills" icon={Icons.Skills} collapsed={collapsed} />
        <NavItem href="/content" label="Content" icon={Icons.Content} collapsed={collapsed} />
      </nav>

      <div className="pt-4 border-t border-white/5">
        <NavItem href="/settings" label="Settings" icon={Icons.Settings} collapsed={collapsed} />
      </div>
    </aside>
  )
}
