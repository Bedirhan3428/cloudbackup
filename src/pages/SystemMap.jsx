import { useState, useEffect } from 'react'
import { Monitor, HardDrive, Folder, ChevronRight, ChevronDown, User } from 'lucide-react'
import { api } from '../api'

// Recursive tree component — handles the object structure from agent
const DirectoryTree = ({ map }) => {
  if (!map || Object.keys(map).length === 0) {
    return <div className="text-sm text-slate-500 italic p-4">Klasör haritası bulunamadı veya boş.</div>
  }

  return (
    <div className="space-y-4 p-4">
      {Object.entries(map).map(([userName, userData]) => {
        // Paths objesini al (agent.py: user_info["paths"])
        const paths = userData?.paths || {}
        // Sadece gerçek klasör isimlerini al (is_onedrive flaglarını atla)
        const folderNames = Object.keys(paths).filter(key => !key.endsWith('_is_onedrive'))
        
        return (
          <div key={userName} className="bg-bg rounded-lg border border-[#162033] overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#162033] bg-[#162033]/30">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-slate-200 text-sm">{userName}</span>
              <span className="text-xs text-slate-500 ml-auto">{folderNames.length} klasör</span>
            </div>
            <div className="p-3">
              {folderNames.length === 0 ? (
                <div className="text-xs text-slate-500 ml-6 py-1">İçerik yok</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {folderNames.map(name => {
                    const fullPath = paths[name]
                    const isOnedrive = paths[`${name}_is_onedrive`]
                    return (
                      <div key={name} className="group relative">
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.05]">
                          <Folder className={`w-4 h-4 ${isOnedrive ? 'text-blue-300' : 'text-blue-400'} fill-blue-400/20`} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm text-slate-300 truncate font-medium">{name}</span>
                            <span className="text-[10px] text-slate-500 truncate" title={fullPath}>{fullPath}</span>
                          </div>
                          {isOnedrive && (
                            <span className="ml-auto text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">Cloud</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function SystemMap() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  function load() {
    api.getAgents()
      .then(d => {
        setAgents(d.agents || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <HardDrive className="w-6 h-6 text-emerald-400" />
          Sistem ve Dizin Haritası
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Bağlı cihazlardan gelen güncel C:\Users dizin yapıları.
        </p>
      </div>

      {loading && agents.length === 0 ? (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-800 rounded"></div>
              <div className="h-4 bg-slate-800 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-[#162033]">
          <Monitor className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300">Cihaz Bulunamadı</h3>
          <p className="text-slate-500 text-sm mt-1">Bağlı bir CloudBackup agent yok.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {agents.map(a => (
            <div key={a.machine_name} className="bg-surface rounded-xl border border-[#162033] shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#162033]">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${a.online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                  <h2 className="font-semibold text-slate-100 text-lg flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-slate-400" />
                    {a.machine_name}
                  </h2>
                </div>
                {!a.online && (
                  <span className="text-xs font-medium bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full border border-red-500/20">
                    Çevrimdışı
                  </span>
                )}
              </div>
              
              <div className="bg-[#0f1523]">
                <DirectoryTree map={a.directory_map} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
