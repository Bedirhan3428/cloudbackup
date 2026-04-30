import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Cpu, LayoutDashboard, FolderOpen, Settings, FileText, LogOut, Monitor, HardDrive, Zap, Sparkles } from 'lucide-react'
import { clearKey, api, getKey } from '../api'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/files',     icon: FolderOpen,      label: 'Dosyalar' },
  { to: '/chat',      icon: Sparkles,        label: 'Intelligence' }, // AI Sayfası
  { to: '/settings',  icon: Settings,        label: 'Ayarlar' },
  { to: '/logs',      icon: FileText,        label: 'Terminal' },
  { to: '/system-map',icon: HardDrive,       label: 'Explorer' },
]

export default function Layout() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])

  useEffect(() => {
    const load = () => api.getAgents().then(d => setAgents(d.agents || [])).catch(() => {})
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  function logout() {
    clearKey()
    navigate('/login')
  }

  const onlineCount = agents.filter(a => a.online).length

  return (
    <div className="flex min-h-screen bg-[#050814]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col fixed inset-y-0 left-0 z-30 bg-[#070b14]/90 backdrop-blur-xl border-r border-cyan-900/30">
        
        {/* Logo */}
        <div className="px-5 py-5 border-b border-cyan-900/30">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border border-cyan-500/30 rounded-lg animate-pulse-glow" />
              <div className="w-8 h-8 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center relative z-10">
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 text-sm tracking-widest">ASHFIR</span>
          </div>
        </div>

        {/* Key badge */}
        <div className="px-4 py-2.5 border-b border-cyan-900/30">
          <div className="font-mono text-[9px] text-cyan-600/50 bg-[#050810] rounded px-2 py-1.5 truncate border border-cyan-900/20 tracking-wider">
            {getKey()}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 ` +
                (isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                  : 'text-cyan-700 hover:text-cyan-400 hover:bg-cyan-500/5 border border-transparent')
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Agent status */}
        <div className="px-4 py-3 border-t border-cyan-900/30">
          <div className="text-[9px] font-mono font-bold text-cyan-700 uppercase tracking-[0.2em] mb-2">
            Connected Nodes
          </div>
          {agents.length === 0 ? (
            <div className="flex items-center gap-2 text-[10px] text-cyan-800 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-900" />
              No agents linked
            </div>
          ) : (
            <div className="space-y-1.5">
              {agents.slice(0, 3).map(a => (
                <div key={a.machine_name} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-cyan-900'}`} />
                  <div className="min-w-0">
                    <div className="text-[10px] text-cyan-400/80 truncate font-mono">{a.machine_name}</div>
                    <div className="text-[9px] text-cyan-700 font-mono">{a.files_uploaded} files</div>
                  </div>
                </div>
              ))}
              {agents.length > 3 && <div className="text-[9px] text-cyan-700 font-mono">+{agents.length - 3} more</div>}
            </div>
          )}
          {onlineCount > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-mono font-bold tracking-wider">{onlineCount} ONLINE</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono text-cyan-800 hover:text-red-400 hover:bg-red-500/5 w-full transition-all border border-transparent hover:border-red-500/20 tracking-wider uppercase font-bold"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="ml-56 flex-1 h-screen overflow-auto relative">
        {/* Subtle grid background */}
        <div className="fixed inset-0 ml-56 pointer-events-none grid-bg opacity-50" />
        <div className="relative z-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
