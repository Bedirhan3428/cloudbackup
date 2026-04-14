import { useEffect, useState, useRef } from 'react'
import { api } from '../api'
import { RefreshCw, Play, Pause } from 'lucide-react'

const LEVELS = {
  success: 'text-emerald-400 bg-emerald-500/5',
  error:   'text-red-400 bg-red-500/5',
  warn:    'text-amber-400 bg-amber-500/5',
  ai:      'text-purple-400 bg-purple-500/5',
  skip:    'text-slate-600 bg-transparent',
  info:    'text-slate-500 bg-transparent',
}

const FILTERS = [
  { key: 'all',     label: 'Tümü' },
  { key: 'success', label: '☁️ Yüklendi' },
  { key: 'ai',      label: '🤖 AI' },
  { key: 'skip',    label: '⏭️ Atlandı' },
  { key: 'error',   label: '❌ Hata' },
  { key: 'warn',    label: '⚠️ Uyarı' },
]

export default function Logs() {
  const [logs, setLogs]       = useState([])
  const [lines, setLines]     = useState(200)
  const [filter, setFilter]   = useState('all')
  const [autoRefresh, setAuto] = useState(true)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  async function load() {
    setLoading(true)
    try {
      const d = await api.getLogs(lines)
      setLogs(d.logs || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    load()
    if (!autoRefresh) return
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [lines, autoRefresh])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Loglar</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} kayıt</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="inp w-32" value={lines} onChange={e => setLines(+e.target.value)}>
            <option value={100}>Son 100</option>
            <option value={200}>Son 200</option>
            <option value={500}>Son 500</option>
          </select>
          <button
            onClick={() => setAuto(!autoRefresh)}
            className={`btn-ghost flex items-center gap-2 ${autoRefresh ? 'text-emerald-400 border-emerald-500/20' : ''}`}
          >
            {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {autoRefresh ? 'Canlı' : 'Durduruldu'}
          </button>
          <button onClick={load} className="btn-ghost flex items-center gap-2" disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* Level filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
              filter === f.key
                ? 'bg-blue-600/15 text-blue-400 border-blue-500/25'
                : 'bg-transparent text-slate-600 border-[#162033] hover:text-slate-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Log viewer */}
      <div className="card overflow-hidden">
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] p-3 font-mono text-xs">
          {filtered.length === 0 ? (
            <div className="text-center text-slate-700 py-12">Henüz log yok</div>
          ) : (
            filtered.map((line, i) => (
              <div
                key={i}
                className={`py-0.5 px-2 rounded transition-colors ${LEVELS[line.level] || LEVELS.info} hover:bg-white/[0.03]`}
              >
                {line.text}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
