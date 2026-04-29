import { useEffect, useState, useRef } from 'react'
import { api } from '../api'
import { RefreshCw, Play, Pause, Terminal, ChevronRight } from 'lucide-react'

const LEVELS = {
  success: 'text-emerald-400',
  error:   'text-red-400',
  warn:    'text-amber-400',
  ai:      'text-purple-400',
  skip:    'text-cyan-800',
  info:    'text-cyan-600',
}

const LEVEL_PREFIX = {
  success: '[  OK  ]',
  error:   '[ERROR ]',
  warn:    '[ WARN ]',
  ai:      '[  AI  ]',
  skip:    '[ SKIP ]',
  info:    '[ INFO ]',
}

const FILTERS = [
  { key: 'all',     label: 'ALL' },
  { key: 'success', label: 'OK' },
  { key: 'ai',      label: 'AI' },
  { key: 'skip',    label: 'SKIP' },
  { key: 'error',   label: 'ERR' },
  { key: 'warn',    label: 'WARN' },
]

export default function Logs() {
  const [logs, setLogs]       = useState([])
  const [lines, setLines]     = useState(200)
  const [filter, setFilter]   = useState('all')
  const [autoRefresh, setAuto] = useState(true)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

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

  // Auto-scroll to bottom
  useEffect(() => {
    if (bottomRef.current && autoRefresh) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoRefresh])

  const filtered = filter === 'all' ? logs : logs.filter(l => {
    const level = l.level || (typeof l === 'string' && l.includes('[ERROR]') ? 'error' : 
                   typeof l === 'string' && l.includes('[WARN]') ? 'warn' : 'info')
    return level === filter
  })

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 tracking-widest flex items-center gap-3">
            <Terminal className="w-6 h-6 text-cyan-400" />
            TERMINAL
          </h1>
          <p className="text-[10px] font-mono text-cyan-600 uppercase tracking-[0.2em] mt-1">
            Agent Log Stream • {filtered.length} entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="inp w-28 text-[10px] py-1.5" value={lines} onChange={e => setLines(+e.target.value)}>
            <option value={100}>LAST 100</option>
            <option value={200}>LAST 200</option>
            <option value={500}>LAST 500</option>
          </select>
          <button
            onClick={() => setAuto(!autoRefresh)}
            className={`btn-ghost flex items-center gap-2 ${autoRefresh ? '!text-emerald-400 !border-emerald-500/30' : ''}`}
          >
            {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {autoRefresh ? 'LIVE' : 'PAUSED'}
          </button>
          <button onClick={load} className="btn-ghost flex items-center gap-2" disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Level filter */}
      <div className="flex gap-1 mb-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border transition-all tracking-wider ${
              filter === f.key
                ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                : 'bg-transparent text-cyan-800 border-cyan-900/30 hover:text-cyan-500 hover:border-cyan-500/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Terminal Window */}
      <div className="flex-1 min-h-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="h-full bg-[#050810] border border-cyan-900/30 rounded-xl overflow-hidden flex flex-col relative">
          
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#070b14] border-b border-cyan-900/30">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-[9px] font-mono text-cyan-700 ml-2 tracking-widest">ashfir@agent — log stream</span>
            </div>
            <div className="flex items-center gap-1.5">
              {autoRefresh && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              <span className="text-[9px] font-mono text-cyan-800 tracking-wider">{autoRefresh ? 'STREAMING' : 'FROZEN'}</span>
            </div>
          </div>

          {/* Log Content */}
          <div ref={containerRef} className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed">
            {filtered.length === 0 ? (
              <div className="text-center text-cyan-800 py-12 font-mono">
                <Terminal className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-xs tracking-widest">AWAITING LOG DATA...</p>
              </div>
            ) : (
              filtered.map((logItem, i) => {
                const text = typeof logItem === 'string' ? logItem : (logItem.message || logItem.text)
                const level = logItem.level || (text.includes('[ERROR]') ? 'error' : 
                              text.includes('[WARN]') ? 'warn' : 'info')
                const prefix = LEVEL_PREFIX[level] || LEVEL_PREFIX.info
                const colorClass = LEVELS[level] || LEVELS.info
                
                return (
                  <div
                    key={i}
                    className={`py-0.5 flex items-start gap-2 hover:bg-cyan-500/5 rounded px-2 -mx-2 transition-colors group`}
                  >
                    <span className="text-cyan-800 select-none flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                      {String(i + 1).padStart(3, '0')}
                    </span>
                    <span className={`flex-shrink-0 ${colorClass} opacity-70`}>{prefix}</span>
                    <span className={`${colorClass} break-all`}>{text}</span>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
            
            {/* Blinking cursor */}
            <div className="flex items-center gap-1 mt-1 text-cyan-600">
              <ChevronRight className="w-3 h-3" />
              <div className="w-2 h-4 bg-cyan-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
