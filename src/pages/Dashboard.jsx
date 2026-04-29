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

const EXT_COLORS = ['#06b6d4','#10b981','#8b5cf6','#f59e0b','#ef4444','#3b82f6','#84cc16','#f43f5e']

export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [agents, setAgents] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, a, f] = await Promise.all([
        api.getStats(),
        api.getAgents(),
        api.getFiles({ per_page: 8 }),
      ])
      setStats(s)
      setAgents(a.agents || [])
      setRecent(f.files || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [load])

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
            <h2 className="font-mono font-bold text-cyan-400 text-xs tracking-widest uppercase">Recent Backups</h2>
            <button onClick={() => nav('/files')} className="text-[10px] text-cyan-600 hover:text-cyan-400 flex items-center gap-1 font-mono uppercase tracking-wider transition-colors">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div>
            {recent.length === 0 && !loading ? (
              <div className="py-12 text-center text-cyan-700 text-xs font-mono">No files backed up yet</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {recent.map((f, i) => (
                    <tr key={f.path} className="border-b border-cyan-900/20 last:border-0 hover:bg-cyan-500/5 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg leading-none">{f.icon}</span>
                          <div className="min-w-0">
                            <div className="font-medium text-cyan-100 truncate max-w-[200px] text-xs">{f.name}</div>
                            <div className="text-[9px] text-cyan-700 truncate max-w-[200px] font-mono">{f.original_path}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-cyan-600 whitespace-nowrap">{f.size_human}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px]">{f.machine}</span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-cyan-700 whitespace-nowrap font-mono">{timeAgo(f.backup_time || f.updated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
