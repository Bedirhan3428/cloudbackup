import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import { Search, Trash2, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

function timeAgo(str) {
  if (!str) return '—'
  const s = (Date.now() - new Date(str)) / 1000
  if (s < 60) return Math.round(s) + 'sn önce'
  if (s < 3600) return Math.round(s / 60) + 'dk önce'
  if (s < 86400) return Math.round(s / 3600) + 'sa önce'
  return new Date(str).toLocaleDateString('tr-TR')
}

export default function Files() {
  const [files, setFiles]       = useState([])
  const [stats, setStats]       = useState({})
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [extFilter, setExt]     = useState('')
  const [extList, setExtList]   = useState([])
  const [page, setPage]         = useState(1)
  const [deleting, setDeleting] = useState(null)
  const [toast, setToast]       = useState(null)
  const PER = 50

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const d = await api.getFiles({ search, ext: extFilter, page: p, per_page: PER })
      setFiles(d.files || [])
      setStats(d)
      if (d.ext_stats) setExtList(Object.keys(d.ext_stats))
    } catch (e) { showToast('❌ ' + e.message) }
    setLoading(false)
  }, [search, extFilter, page])

  useEffect(() => { load() }, [extFilter])
  useEffect(() => { const t = setTimeout(() => load(1), 350); return () => clearTimeout(t) }, [search])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function deleteFile(f) {
    if (!confirm(`"${f.name}" silinsin mi?`)) return
    setDeleting(f.path)
    try {
      await api.deleteFile(f.path)
      setFiles(prev => prev.filter(x => x.path !== f.path))
      showToast('🗑️ Silindi.')
    } catch (e) { showToast('❌ ' + e.message) }
    setDeleting(null)
  }

  function changePage(p) {
    const max = Math.ceil((stats.total || 0) / PER)
    if (p < 1 || p > max) return
    setPage(p)
    load(p)
  }

  const totalPages = Math.ceil((stats.total || 0) / PER)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Dosyalar</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            <span className="text-slate-300 font-medium">{stats.total?.toLocaleString() ?? 0}</span> dosya,{' '}
            <span className="text-blue-400 font-medium">{stats.total_size_human ?? '0 B'}</span>
          </p>
        </div>
        <button onClick={() => load()} className="btn-ghost flex items-center gap-2" disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            className="inp pl-10"
            placeholder="Dosya adı, klasör..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
          <select className="inp pl-10 w-40 appearance-none" value={extFilter} onChange={e => { setExt(e.target.value); setPage(1) }}>
            <option value="">Tüm türler</option>
            {extList.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#162033]">
              {['Dosya', 'Boyut', 'Makine', 'AI Kararı', 'Zaman', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider bg-black/20 first:pl-5 last:pr-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && files.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-slate-600">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-700" />
                Yükleniyor...
              </td></tr>
            ) : files.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-slate-600">
                <div className="text-3xl mb-2">☁️</div>
                {search ? 'Eşleşen dosya bulunamadı' : 'Henüz dosya yok'}
              </td></tr>
            ) : files.map(f => (
              <tr key={f.path} className="border-b border-[#162033]/40 last:border-0 hover:bg-white/[0.015] transition-colors group">
                <td className="pl-5 pr-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none flex-shrink-0">{f.icon}</span>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-200 truncate max-w-[220px]" title={f.name}>{f.name}</div>
                      <div className="text-[11px] text-slate-600 font-mono truncate max-w-[220px]" title={f.original_path}>{f.original_path}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{f.size_human}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-blue-500/8 text-blue-400 border border-blue-500/15 text-[10px]">{f.machine}</span>
                </td>
                <td className="px-4 py-3 max-w-[180px]">
                  {f.ai_reason ? (
                    <div>
                      <span className="text-[11px] text-emerald-400">{f.ai_reason}</span>
                      {f.ai_confidence && <span className="text-[10px] text-slate-600 ml-1">({f.ai_confidence})</span>}
                    </div>
                  ) : <span className="text-slate-700 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{timeAgo(f.backup_time || f.updated)}</td>
                <td className="pr-5 py-3">
                  <button
                    onClick={() => deleteFile(f)}
                    disabled={deleting === f.path}
                    className="opacity-0 group-hover:opacity-100 transition-opacity btn-danger flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    {deleting === f.path ? '...' : 'Sil'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button className="btn-ghost p-2" onClick={() => changePage(page - 1)} disabled={page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-500">
            <span className="text-slate-300 font-medium">{page}</span> / {totalPages}
          </span>
          <button className="btn-ghost p-2" onClick={() => changePage(page + 1)} disabled={page >= totalPages}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-card border border-[#162033] rounded-xl px-5 py-3.5 text-sm shadow-2xl z-50 animate-pulse-slow">
          {toast}
        </div>
      )}
    </div>
  )
}
