import { useState, useEffect } from 'react'
import { Monitor, HardDrive, Folder, Server, ChevronRight, CornerUpLeft, Search, Cpu, Database, Network } from 'lucide-react'
import { api } from '../api'

export default function SystemMap() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  
  // pathHistory stack
  // e.g. [ { type: 'home', label: 'Network' }, { type: 'agent', label: 'PC-1', data: agentObj }, { type: 'category', label: 'C:\\ Kök Klasörleri', data: { paths: {...} } } ]
  const [path, setPath] = useState([{ type: 'home', label: 'Network' }])

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

  const currentLevel = path[path.length - 1]

  const navigateTo = (item, type, data = null) => {
    setPath(prev => [...prev, { type, label: item, data }])
  }

  const goBack = () => {
    if (path.length > 1) {
      setPath(prev => prev.slice(0, -1))
    }
  }

  const navigateToBreadcrumb = (index) => {
    setPath(prev => prev.slice(0, index + 1))
  }

  // Determine what to render based on the current level
  const renderContent = () => {
    if (loading && agents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-cyan-500/50 space-y-4 animate-pulse">
          <Cpu className="w-12 h-12" />
          <span className="font-mono tracking-widest text-sm uppercase">Scanning Network Nodes...</span>
        </div>
      )
    }

    if (currentLevel.type === 'home') {
      if (agents.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-20 text-cyan-500/50 border border-cyan-500/10 bg-cyan-950/10 rounded-xl">
            <Server className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="font-mono tracking-widest uppercase mb-1 text-cyan-400">No Nodes Found</h3>
            <p className="text-xs text-cyan-600">Waiting for agent uplink...</p>
          </div>
        )
      }
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(a => (
            <div 
              key={a.machine_name} 
              onClick={() => navigateTo(a.machine_name, 'agent', a)}
              className="group relative bg-[#0b1221]/80 backdrop-blur-md border border-cyan-500/20 rounded-xl p-5 cursor-pointer overflow-hidden transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            >
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-cyan-400" />
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold tracking-wider border ${a.online ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                  {a.online ? 'ONLINE' : 'OFFLINE'}
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-1">{a.machine_name}</h3>
              <p className="text-xs text-cyan-600/70 font-mono tracking-wider">Node ID: {a.key ? a.key.substring(0,8) : 'UNKNOWN'}</p>
            </div>
          ))}
        </div>
      )
    }

    if (currentLevel.type === 'agent') {
      const map = currentLevel.data?.directory_map || {}
      const categories = Object.keys(map)
      
      if (categories.length === 0) {
        return (
          <div className="p-8 text-center text-cyan-500/50 font-mono text-sm border border-cyan-500/10 bg-cyan-950/10 rounded-xl">
            No directory data received from this node yet.
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => {
            const isDrive = cat.toLowerCase().includes('sürücü')
            const isRoot = cat.toLowerCase().includes('kök')
            const Icon = isDrive ? HardDrive : isRoot ? Database : Folder
            
            return (
              <div 
                key={cat}
                onClick={() => navigateTo(cat, 'category', map[cat])}
                className="group flex items-center gap-4 bg-[#0a101d] border border-cyan-900/40 rounded-xl p-4 cursor-pointer hover:bg-cyan-950/30 hover:border-cyan-500/40 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#050810] border border-cyan-900/50 flex items-center justify-center group-hover:border-cyan-500/50 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all">
                  <Icon className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">{cat}</h4>
                  <p className="text-[10px] text-cyan-600/60 font-mono mt-0.5">Directory Container</p>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    if (currentLevel.type === 'category') {
      const paths = currentLevel.data?.paths || {}
      // Sadece gerçek klasörleri al, onedrive işaretçilerini atla
      const folderNames = Object.keys(paths).filter(k => !k.endsWith('_is_onedrive'))

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {folderNames.map(name => {
            const isCloud = paths[`${name}_is_onedrive`]
            const fullPath = paths[name]
            return (
              <div 
                key={name}
                onClick={() => navigateTo(name, 'folder', fullPath)}
                className="group flex items-center gap-3 bg-[#070b14] border border-cyan-900/30 rounded-lg p-3 cursor-pointer hover:bg-cyan-900/20 hover:border-cyan-500/30 transition-all"
              >
                <Folder className={`w-5 h-5 flex-shrink-0 ${isCloud ? 'text-blue-400 fill-blue-400/20' : 'text-emerald-400 fill-emerald-400/10'}`} />
                <div className="overflow-hidden">
                  <h4 className="text-sm font-medium text-slate-300 truncate group-hover:text-cyan-100">{name}</h4>
                  <p className="text-[9px] text-cyan-700 font-mono truncate" title={fullPath}>{fullPath}</p>
                </div>
                {isCloud && (
                  <Cloud className="w-3 h-3 text-blue-500 ml-auto flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      )
    }

    if (currentLevel.type === 'folder') {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-[#070b14] border border-cyan-900/30 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]" />
          <Folder className="w-16 h-16 text-cyan-500/40 mb-4" />
          <h3 className="text-xl font-bold text-slate-200 mb-2">{currentLevel.label}</h3>
          <div className="bg-[#050810] px-4 py-2 rounded-lg border border-cyan-900/50 font-mono text-xs text-cyan-400 select-all">
            {currentLevel.data}
          </div>
          <p className="text-[10px] text-cyan-600/70 uppercase tracking-widest mt-6">
            Deeper scanning disabled by system policy
          </p>
        </div>
      )
    }

    return null
  }

  // Construct current path string for the display bar
  let pathString = "NETWORK:\\\\"
  if (path.length > 1) pathString += path[1].label + "\\"
  if (path.length > 3) pathString = currentLevel.data // If folder selected, use its full path directly!
  else if (path.length > 2) pathString += path[2].label + "\\"

  return (
    <div className="p-6 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)]">
      
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 tracking-widest flex items-center gap-3 drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
          <Network className="w-6 h-6 text-cyan-400" />
          SYSTEM EXPLORER
        </h1>
        <p className="text-[10px] font-mono text-cyan-600 uppercase tracking-[0.2em] mt-1">
          Remote Node File System Navigator
        </p>
      </div>

      {/* Explorer Window */}
      <div className="bg-[#0b1221]/90 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        
        {/* Address Bar Area */}
        <div className="bg-[#070b14] border-b border-cyan-900/50 p-3 flex items-center gap-3">
          <div className="flex gap-1">
            <button 
              onClick={goBack}
              disabled={path.length === 1}
              className="p-2 rounded bg-cyan-950/30 border border-cyan-900/50 text-cyan-500 hover:bg-cyan-900/50 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <CornerUpLeft className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 bg-[#050810] border border-cyan-900/50 rounded flex items-center px-3 py-2 shadow-inner">
            <Search className="w-4 h-4 text-cyan-700 mr-2" />
            <span className="font-mono text-xs text-cyan-300 truncate w-full select-all">
              {pathString}
            </span>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="bg-[#0a101d]/50 px-4 py-2 border-b border-cyan-900/30 flex items-center gap-1 overflow-x-auto whitespace-nowrap hide-scrollbar">
          {path.map((step, idx) => (
            <div key={idx} className="flex items-center">
              <button 
                onClick={() => navigateToBreadcrumb(idx)}
                className={`text-xs font-mono px-2 py-1 rounded transition-colors ${idx === path.length - 1 ? 'text-cyan-300 bg-cyan-900/30' : 'text-cyan-600/70 hover:text-cyan-400 hover:bg-cyan-950/30'}`}
              >
                {step.label}
              </button>
              {idx < path.length - 1 && <ChevronRight className="w-3 h-3 text-cyan-800 mx-0.5" />}
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative">
          {/* subtle background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
          
          <div className="relative z-10 animate-fade-in">
            {renderContent()}
          </div>
        </div>

        {/* Status Footer */}
        <div className="bg-[#050810] border-t border-cyan-900/50 px-4 py-1.5 flex justify-between items-center text-[9px] font-mono uppercase tracking-wider text-cyan-700">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Terminal Connected
          </div>
          <div>Nodes: {agents.length}</div>
        </div>
      </div>
    </div>
  )
}
