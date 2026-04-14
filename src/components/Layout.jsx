import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Cloud, LayoutDashboard, FolderOpen, Settings, FileText, LogOut, Monitor } from 'lucide-react'
import { clearKey, api, getKey } from '../api'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/files',     icon: FolderOpen,      label: 'Dosyalar' },
  { to: '/settings',  icon: Settings,        label: 'Ayarlar' },
  { to: '/logs',      icon: FileText,        label: 'Loglar' },
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
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-surface border-r border-[#162033] fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#162033]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-bold text-slate-100 text-[15px]">CloudBackup</span>
          </div>
        </div>

        {/* Key badge */}
        <div className="px-4 py-2.5 border-b border-[#162033]">
          <div className="font-mono text-[10px] text-slate-600 bg-bg rounded px-2 py-1 truncate">
            {getKey()}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ` +
                (isActive
                  ? 'bg-blue-600/12 text-blue-400 border border-blue-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border border-transparent')
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Agent status */}
        <div className="px-4 py-3 border-t border-[#162033]">
          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Bağlı Bilgisayarlar
          </div>
          {agents.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              Agent bağlı değil
            </div>
          ) : (
            <div className="space-y-1.5">
              {agents.slice(0, 3).map(a => (
                <div key={a.machine_name} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.online ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-slate-600'}`} />
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 truncate">{a.machine_name}</div>
                    <div className="text-[10px] text-slate-600">{a.files_uploaded} dosya</div>
                  </div>
                </div>
              ))}
              {agents.length > 3 && <div className="text-[10px] text-slate-600">+{agents.length - 3} daha</div>}
            </div>
          )}
          {onlineCount > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <Monitor className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-500 font-medium">{onlineCount} çevrimiçi</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:text-red-400 hover:bg-red-500/5 w-full transition-all border border-transparent hover:border-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            Çıkış
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="ml-56 flex-1 min-h-screen">
        <Outlet />
      </div>
    </div>
  )
}
