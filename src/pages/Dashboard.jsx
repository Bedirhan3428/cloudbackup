import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'
import { HardDrive, Cloud, Cpu, Brain, RefreshCw, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'text-blue-400 bg-blue-600/10 border-blue-500/15',
    green: 'text-emerald-400 bg-emerald-600/10 border-emerald-500/15',
    purple: 'text-purple-400 bg-purple-600/10 border-purple-500/15',
    amber: 'text-amber-400 bg-amber-600/10 border-amber-500/15',
  }
  return (
    <div className="card p-5 hover:border-blue-500/20 transition-colors duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-slate-100 tabular-nums">{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          <Icon className="w-4 h-4" />
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

const EXT_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#84cc16','#f43f5e']

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Yedekleme sistemine genel bakış</p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2" disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Cloud} label="Toplam Dosya" value={stats?.total_files?.toLocaleString()} sub="Firebase Storage" color="blue" />
        <StatCard icon={HardDrive} label="Kullanılan Alan" value={stats?.total_size_human} sub="Firebase Storage" color="green" />
        <StatCard icon={Cpu} label="Bağlı Bilgisayar" value={`${agents.filter(a=>a.online).length} / ${agents.length}`} sub="Agent durumu" color="purple" />
        <StatCard icon={Brain} label="AI Tarafından Atlandı" value={agents.reduce((s,a)=>s+(a.ai_skipped||0),0).toLocaleString()} sub="Gereksiz dosyalar" color="amber" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Recent files - 2 cols */}
        <div className="col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#162033]">
            <h2 className="font-semibold text-slate-200 text-sm">Son Yedeklenen Dosyalar</h2>
            <button onClick={() => nav('/files')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Tümü <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div>
            {recent.length === 0 && !loading ? (
              <div className="py-12 text-center text-slate-600 text-sm">Henüz dosya yok</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {recent.map(f => (
                    <tr key={f.path} className="border-b border-[#162033]/50 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg leading-none">{f.icon}</span>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-200 truncate max-w-[200px]">{f.name}</div>
                            <div className="text-[11px] text-slate-600 truncate max-w-[200px] font-mono">{f.original_path}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{f.size_human}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-blue-500/10 text-blue-400 border border-blue-500/15">{f.machine}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{timeAgo(f.backup_time || f.updated)}</td>
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
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#162033]">
              <h2 className="font-semibold text-slate-200 text-sm">Bilgisayarlar</h2>
              <button onClick={() => nav('/system-map')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                Sistem Haritası <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {agents.length === 0 ? (
                <div className="text-center text-slate-600 text-xs py-4">
                  <div className="text-2xl mb-2">🖥️</div>
                  Agent bağlı değil
                </div>
              ) : agents.map(a => (
                <div key={a.machine_name} className="bg-bg rounded-lg p-3 border border-[#162033]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.online ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-slate-700'}`} />
                      <span className="font-semibold text-slate-200 text-sm">{a.machine_name}</span>
                    </div>
                    <span className={`badge text-[10px] ${a.online ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700/30 text-slate-600 border-slate-700/40'}`}>
                      {a.online ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 text-[11px] text-slate-600">
                    <span>Yüklenen: <span className="text-slate-400 font-medium">{a.files_uploaded}</span></span>
                    <span>Atlanan: <span className="text-amber-500 font-medium">{a.ai_skipped || 0}</span></span>
                    {a.last_file && <span className="col-span-2 truncate">Son: <span className="text-blue-400">{a.last_file}</span></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ext chart */}
          {extChartData.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3.5 border-b border-[#162033]">
                <h2 className="font-semibold text-slate-200 text-sm">Dosya Türleri</h2>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={extChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0d1525', border: '1px solid #162033', borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: '#94a3b8' }}
                      cursor={{ fill: 'rgba(59,130,246,0.05)' }}
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
