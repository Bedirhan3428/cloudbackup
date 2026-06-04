import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'
import { HardDrive, Cloud, Cpu, Brain, RefreshCw, ChevronRight, Activity, Database, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function StatCard({ icon: Icon, label, value, sub, delay = 0 }) {
  return (
    <div className="card p-5 group hover:border-cyan-500/30 transition-all duration-300 animate-slide-up corner-accents" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-[0.15em] mb-2">{label}</p>
          <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300 tabular-nums">{value ?? '—'}</p>
          {sub && <p className="text-[10px] text-cyan-700 mt-1 font-mono">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all">
          <Icon className="w-5 h-5 text-cyan-500" />
        </div>
      </div>
    </div>
  )
}

function timeAgo(str) {
  if (!str) return '—'
  const s = (Date.now() - new Date(str)) / 1000
  if (s < 60) return Math.round(s) + 'sn önce'
  if (s < 3600) return Math.round(s / 60) + 'dk önce'
  if (s < 86400) return Math.round(s / 3600) + 'sa önce'
  return Math.round(s / 86400) + 'gün önce'
}

function humanSize(bytes) {
  if (!bytes) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (bytes >= 1024 && i < u.length - 1) { bytes /= 1024; i++ }
  return `${bytes.toFixed(1)} ${u[i]}`
}

const EXT_COLORS = ['#06b6d4','#10b981','#8b5cf6','#f59e0b','#ef4444','#3b82f6','#84cc16','#f43f5e']

export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [agents, setAgents] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedFiles, setExpandedFiles] = useState({})
  const [activeTab, setActiveTab] = useState('files') // 'files' | 'zips'
  const nav = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, a, f] = await Promise.all([
        api.getStats(),
        api.getAgents(),
        api.getFiles({ per_page: 100 }),
      ])
      setStats(s)
      setAgents(a.agents || [])
      setRecent(f.files || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [load])

  const recentFiles = useMemo(() => {
    const files = []
    recent.forEach(z => {
      if (z.original_files && Array.isArray(z.original_files)) {
        z.original_files.forEach(f => {
          const name = f.path.split(/[\\/]/).pop() || 'isimsiz'
          files.push({
            name,
            original_path: f.path,
            size_human: f.size ? humanSize(f.size) : '0 B',
            machine: z.machine,
            backup_time: z.backup_time || z.updated || '',
            zip_name: z.name
          })
        })
      }
    })
    return files.sort((a, b) => new Date(b.backup_time) - new Date(a.backup_time)).slice(0, 100)
  }, [recent])

  const extChartData = stats?.ext_stats
    ? Object.entries(stats.ext_stats).slice(0, 8).map(([k, v]) => ({ name: k, count: v }))
    : []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 tracking-widest flex items-center gap-3">
            <Activity className="w-6 h-6 text-cyan-400" />
            DASHBOARD
          </h1>
          <p className="text-[10px] font-mono text-cyan-600 uppercase tracking-[0.2em] mt-1">System Overview & Monitoring</p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2" disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Cloud} label="Total Files" value={stats?.total_files?.toLocaleString()} sub="Firebase Storage" delay={0} />
        <StatCard icon={Database} label="Storage Used" value={stats?.total_size_human} sub="Encrypted Data" delay={100} />
        <StatCard icon={Cpu} label="Nodes" value={`${agents.filter(a=>a.online).length} / ${agents.length}`} sub="Agent Status" delay={200} />
        <StatCard icon={Brain} label="AI Skipped" value={agents.reduce((s,a)=>s+(a.ai_skipped||0),0).toLocaleString()} sub="Filtered Out" delay={300} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Recent files - 2 cols */}
        <div className="col-span-2 card overflow-hidden animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-900/30">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('files')}
                className={`font-mono font-bold text-xs tracking-widest uppercase transition-all duration-200 ${activeTab === 'files' ? 'text-cyan-400 border-b border-cyan-500 pb-0.5' : 'text-cyan-700 hover:text-cyan-500'}`}
              >
                Son Gelen Dosyalar
              </button>
              <button 
                onClick={() => setActiveTab('zips')}
                className={`font-mono font-bold text-xs tracking-widest uppercase transition-all duration-200 ${activeTab === 'zips' ? 'text-cyan-400 border-b border-cyan-500 pb-0.5' : 'text-cyan-700 hover:text-cyan-500'}`}
              >
                Yedek Arşivleri
              </button>
            </div>
            <button 
              onClick={() => nav(activeTab === 'files' ? '/incoming-files' : '/files')} 
              className="text-[10px] text-cyan-600 hover:text-cyan-400 flex items-center gap-1 font-mono uppercase tracking-wider transition-colors"
            >
              Hepsini Gör <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            {activeTab === 'files' ? (
              recentFiles.length === 0 && !loading ? (
                <div className="py-12 text-center text-cyan-700 text-xs font-mono">Henüz ayıklanmış dosya bulunamadı</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {recentFiles.map((file, i) => (
                      <tr key={i} className="border-b border-cyan-900/20 last:border-0 hover:bg-cyan-500/5 transition-colors font-mono text-[11px]">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-3">
                            <span className="text-sm leading-none">📄</span>
                            <div className="min-w-0">
                              <div className="font-bold text-cyan-100 truncate max-w-[220px]" title={file.name}>{file.name}</div>
                              <div className="text-[9px] text-cyan-700 truncate max-w-[220px]" title={file.original_path}>{file.original_path}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-cyan-600 whitespace-nowrap">{file.size_human}</td>
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <span className="badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] uppercase">{file.machine}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap text-right">{timeAgo(file.backup_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              recent.length === 0 && !loading ? (
                <div className="py-12 text-center text-cyan-700 text-xs font-mono">Henüz yedek yüklenmemiş</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {recent.slice(0, 15).map((f, i) => (
                      <tr key={f.path} className="border-b border-cyan-900/20 last:border-0 hover:bg-cyan-500/5 transition-colors font-mono text-[11px]">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg leading-none">{f.icon}</span>
                            <div className="min-w-0">
                              <div className="font-medium text-cyan-100 truncate max-w-[200px] text-xs">{f.name}</div>
                              <div className="text-[9px] text-cyan-700 truncate max-w-[200px]">{f.original_path}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-cyan-600 whitespace-nowrap">{f.size_human}</td>
                        <td className="px-4 py-3">
                          <span className="badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] uppercase">{f.machine}</span>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-cyan-700 whitespace-nowrap text-right">{timeAgo(f.backup_time || f.updated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Agents */}
          <div className="card overflow-hidden animate-slide-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-cyan-900/30">
              <h2 className="font-mono font-bold text-cyan-400 text-xs tracking-widest uppercase">Nodes</h2>
              <button onClick={() => nav('/system-map')} className="text-[10px] text-cyan-600 hover:text-cyan-400 flex items-center gap-1 font-mono uppercase tracking-wider transition-colors">
                Explorer <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {agents.length === 0 ? (
                <div className="text-center text-cyan-700 text-[10px] py-4 font-mono">
                  <Cpu className="w-8 h-8 mx-auto mb-2 text-cyan-800" />
                  No nodes connected
                </div>
              ) : agents.map(a => (
                <div key={a.machine_name} className="bg-[#070b14] rounded-lg p-3 border border-cyan-900/30 hover:border-cyan-500/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-cyan-900'}`} />
                      <span className="font-mono font-bold text-cyan-200 text-xs">{a.machine_name}</span>
                    </div>
                    <span className={`badge text-[9px] ${a.online ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-cyan-900/20 text-cyan-700 border-cyan-900/30'}`}>
                      {a.online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 text-[10px] text-cyan-700 font-mono">
                    <span>Uploaded: <span className="text-cyan-400">{a.files_uploaded}</span></span>
                    <span>Skipped: <span className="text-amber-500">{a.ai_skipped || 0}</span></span>
                    {a.last_file && <span className="col-span-2 truncate">Last: <span className="text-cyan-500">{a.last_file}</span></span>}
                  </div>
                  {(() => {
                    const desktopPath = a.directory_map?.user_folders?.Desktop?.path || '';
                    const userPath = a.directory_map?._ai_knowledge?.user_info?.profile_path || 
                                     desktopPath.replace(/[\\/]Desktop$/i, '');
                    if (!desktopPath && !userPath) return null;
                    return (
                      <div className="mt-2 pt-2 border-t border-cyan-900/25 space-y-0.5 text-[9px] text-cyan-700 font-mono">
                        {desktopPath && (
                          <div className="truncate" title={desktopPath}>
                            <span className="text-cyan-600">Masaüstü:</span>{' '}
                            <span className="text-cyan-300">{desktopPath}</span>
                          </div>
                        )}
                        {userPath && (
                          <div className="truncate" title={userPath}>
                            <span className="text-cyan-600">Kullanıcı:</span>{' '}
                            <span className="text-emerald-400">{userPath}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* Collapsible Recent Files */}
                  <button 
                    onClick={() => setExpandedFiles(prev => ({ ...prev, [a.machine_name]: !prev[a.machine_name] }))}
                    className="w-full flex items-center justify-between mt-2 pt-2 border-t border-cyan-900/25 text-[9px] font-mono text-cyan-500 hover:text-cyan-400 transition-colors uppercase font-bold text-left"
                  >
                    <span>Son Gelen Dosyalar ({a.directory_map?.recent_files?.length || 0})</span>
                    <span className="text-[7px]">{expandedFiles[a.machine_name] ? '▼' : '▶'}</span>
                  </button>

                  {expandedFiles[a.machine_name] && (
                    <div className="mt-2 space-y-1.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                      {(!a.directory_map?.recent_files || a.directory_map.recent_files.length === 0) ? (
                        <div className="text-[9px] text-cyan-800 font-mono italic p-1">Son dosya bilgisi yok</div>
                      ) : (
                        a.directory_map.recent_files.map((file, idx) => (
                          <div key={idx} className="bg-[#050810]/80 border border-cyan-950/60 rounded p-1.5 flex flex-col space-y-0.5 font-mono text-[9px] hover:border-cyan-500/20 transition-colors">
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="text-cyan-200 font-bold truncate max-w-[130px]" title={file.name}>
                                📄 {file.name}
                              </span>
                              <span className="text-cyan-500/80 whitespace-nowrap">{file.size_human}</span>
                            </div>
                            <div className="flex justify-between text-[8px] text-cyan-700/80 gap-2">
                              <span className="truncate max-w-[110px]" title={file.path}>{file.path}</span>
                              <span className="text-slate-600">{file.modified?.split(' ')[1] || file.modified}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ext chart */}
          {extChartData.length > 0 && (
            <div className="card overflow-hidden animate-slide-up" style={{ animationDelay: '600ms' }}>
              <div className="px-4 py-3.5 border-b border-cyan-900/30">
                <h2 className="font-mono font-bold text-cyan-400 text-xs tracking-widest uppercase">File Types</h2>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={extChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" tick={{ fill: '#0e7490', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#0e7490', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0b1221', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                      itemStyle={{ color: '#67e8f9' }}
                      cursor={{ fill: 'rgba(6,182,212,0.05)' }}
                    />
                    <Bar dataKey="count" radius={[4,4,0,0]}>
                      {extChartData.map((_, i) => <Cell key={i} fill={EXT_COLORS[i % EXT_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
