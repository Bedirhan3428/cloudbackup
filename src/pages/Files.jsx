import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '../api'
import {
  Trash2, Download, RefreshCw, ChevronRight, ChevronLeft, ChevronUp,
  HardDrive, Folder, FileText, Image, Music, Video, Archive, Code,
  File, Monitor, Search, LayoutGrid, LayoutList, ArrowUp
} from 'lucide-react'

/* ─── Helpers ─── */
function humanSize(bytes) {
  if (!bytes) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (bytes >= 1024 && i < u.length - 1) { bytes /= 1024; i++ }
  return `${bytes.toFixed(1)} ${u[i]}`
}

function timeAgo(str) {
  if (!str) return '—'
  const s = (Date.now() - new Date(str)) / 1000
  if (s < 60) return Math.round(s) + 'sn önce'
  if (s < 3600) return Math.round(s / 60) + 'dk önce'
  if (s < 86400) return Math.round(s / 3600) + 'sa önce'
  return new Date(str).toLocaleDateString('tr-TR')
}

function getFileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase() || ''
  const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico']
  const vidExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv']
  const audExts = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'wma']
  const arcExts = ['zip', 'rar', '7z', 'tar', 'gz']
  const codeExts = ['py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'sql', 'sh', 'bat', 'cpp', 'c', 'h', 'java', 'go', 'rs']
  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf']

  if (imgExts.includes(ext)) return <Image className="w-5 h-5" />
  if (vidExts.includes(ext)) return <Video className="w-5 h-5" />
  if (audExts.includes(ext)) return <Music className="w-5 h-5" />
  if (arcExts.includes(ext)) return <Archive className="w-5 h-5" />
  if (codeExts.includes(ext)) return <Code className="w-5 h-5" />
  if (docExts.includes(ext)) return <FileText className="w-5 h-5" />
  return <File className="w-5 h-5" />
}

function getFileColor(name) {
  const ext = name?.split('.').pop()?.toLowerCase() || ''
  const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico']
  const vidExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv']
  const audExts = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'wma']
  const arcExts = ['zip', 'rar', '7z', 'tar', 'gz']
  const codeExts = ['py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'sql', 'sh', 'bat']
  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv']

  if (imgExts.includes(ext)) return 'text-emerald-400'
  if (vidExts.includes(ext)) return 'text-purple-400'
  if (audExts.includes(ext)) return 'text-pink-400'
  if (arcExts.includes(ext)) return 'text-orange-400'
  if (codeExts.includes(ext)) return 'text-cyan-400'
  if (docExts.includes(ext)) return 'text-blue-400'
  return 'text-slate-400'
}

export default function Files() {
  const [currentDir, setCurrentDir] = useState('')
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [history, setHistory] = useState([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [selected, setSelected] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [pathInput, setPathInput] = useState('')
  const [editingPath, setEditingPath] = useState(false)
  const pathInputRef = useRef(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const browse = useCallback(async (dir = currentDir) => {
    setLoading(true)
    try {
      const d = await api.browseFiles(dir)
      setFolders(d.folders || [])
      setFiles(d.files || [])
      setStats({
        total_files: d.total_files,
        total_folders: d.total_folders,
        total_size: d.total_size,
        total_size_human: d.total_size_human,
      })
    } catch (e) {
      showToast('❌ ' + e.message)
    }
    setLoading(false)
  }, [currentDir])

  useEffect(() => { browse(currentDir) }, [currentDir])

  function navigateTo(dir) {
    setSelected(null)
    setContextMenu(null)
    const newHistory = [...history.slice(0, historyIdx + 1), dir]
    setHistory(newHistory)
    setHistoryIdx(newHistory.length - 1)
    setCurrentDir(dir)
    setPathInput(dir)
    setSearch('')
  }

  function goBack() {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1
      setHistoryIdx(newIdx)
      setCurrentDir(history[newIdx])
      setPathInput(history[newIdx])
      setSelected(null)
      setSearch('')
    }
  }

  function goForward() {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1
      setHistoryIdx(newIdx)
      setCurrentDir(history[newIdx])
      setPathInput(history[newIdx])
      setSelected(null)
      setSearch('')
    }
  }

  function goUp() {
    if (!currentDir) return
    const parts = currentDir.replace(/\//g, '\\').split('\\').filter(Boolean)
    parts.pop()
    const parentDir = parts.join('\\')
    navigateTo(parentDir)
  }

  function handlePathSubmit(e) {
    e.preventDefault()
    setEditingPath(false)
    navigateTo(pathInput)
  }

  function handleBreadcrumbClick(index) {
    const parts = currentDir.replace(/\//g, '\\').split('\\').filter(Boolean)
    const newDir = parts.slice(0, index + 1).join('\\')
    navigateTo(newDir)
  }

  async function handleDownload(f) {
    setDownloading(f.path)
    setContextMenu(null)
    showToast('📥 Şifre çözülüyor ve indiriliyor: ' + f.name)
    try {
      const result = await api.downloadAndDecryptFile(f)
      const url = typeof result === 'object' ? result.url : result
      const filename = typeof result === 'object' ? result.filename : f.name
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // Cleanup the object url if it's a blob
      if (url.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(url), 10000)
      }
      showToast('✅ İndirme tamamlandı: ' + f.name)
    } catch (e) {
      showToast('❌ İndirme hatası: ' + e.message)
    }
    setDownloading(null)
  }

  async function handleDelete(f) {
    setContextMenu(null)
    if (!confirm(`"${f.name}" kalıcı olarak silinsin mi?`)) return
    setDeleting(f.path)
    try {
      await api.deleteFile(f.path)
      setFiles(prev => prev.filter(x => x.path !== f.path))
      showToast('🗑️ Silindi: ' + f.name)
      setSelected(null)
    } catch (e) {
      showToast('❌ Silme hatası: ' + e.message)
    }
    setDeleting(null)
  }

  function handleContextMenu(e, item, type) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      type,
    })
  }

  // Close context menu on click outside
  useEffect(() => {
    const handler = () => setContextMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  // Focus path input when editing
  useEffect(() => {
    if (editingPath && pathInputRef.current) {
      pathInputRef.current.focus()
      pathInputRef.current.select()
    }
  }, [editingPath])

  // Initialize path
  useEffect(() => {
    navigateTo('')
  }, [])

  const breadcrumbParts = currentDir ? currentDir.replace(/\//g, '\\').split('\\').filter(Boolean) : []

  // Filter items based on search
  const filteredFolders = search ? folders.filter(f => f.toLowerCase().includes(search.toLowerCase())) : folders
  const filteredFiles = search ? files.filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : files

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in" onClick={() => { setSelected(null); setContextMenu(null) }}>

      {/* ═══ TOOLBAR ═══ */}
      <div className="flex items-center gap-2 mb-3 animate-slide-up">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={goBack}
            disabled={historyIdx <= 0}
            className="p-2 rounded-lg hover:bg-cyan-500/10 disabled:opacity-30 disabled:hover:bg-transparent text-cyan-600 hover:text-cyan-400 transition-all"
            title="Geri"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goForward}
            disabled={historyIdx >= history.length - 1}
            className="p-2 rounded-lg hover:bg-cyan-500/10 disabled:opacity-30 disabled:hover:bg-transparent text-cyan-600 hover:text-cyan-400 transition-all"
            title="İleri"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goUp}
            disabled={!currentDir}
            className="p-2 rounded-lg hover:bg-cyan-500/10 disabled:opacity-30 disabled:hover:bg-transparent text-cyan-600 hover:text-cyan-400 transition-all"
            title="Yukarı"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => browse(currentDir)}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-cyan-500/10 text-cyan-600 hover:text-cyan-400 transition-all"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ═══ PATH BAR ═══ */}
        <div className="flex-1 min-w-0">
          {editingPath ? (
            <form onSubmit={handlePathSubmit} className="flex">
              <input
                ref={pathInputRef}
                value={pathInput}
                onChange={e => setPathInput(e.target.value)}
                onBlur={() => setEditingPath(false)}
                className="w-full bg-[#050810] border border-cyan-500/50 rounded-lg px-3 py-1.5 text-sm text-cyan-200 
                           font-mono outline-none focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Yol girin..."
              />
            </form>
          ) : (
            <div
              onClick={(e) => { e.stopPropagation(); setEditingPath(true); setPathInput(currentDir) }}
              className="flex items-center gap-0 bg-[#050810] border border-cyan-900/40 rounded-lg px-2 py-1.5 cursor-text
                         hover:border-cyan-500/30 transition-colors min-h-[34px] overflow-hidden"
            >
              {/* Root Icon */}
              <button
                onClick={(e) => { e.stopPropagation(); navigateTo('') }}
                className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-cyan-500/10 text-sm text-cyan-500 
                           hover:text-cyan-400 transition-colors flex-shrink-0"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Bu Bilgisayar</span>
              </button>

              {breadcrumbParts.map((part, i) => (
                <div key={i} className="flex items-center flex-shrink-0">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 mx-0.5" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBreadcrumbClick(i) }}
                    className="px-1.5 py-0.5 rounded hover:bg-cyan-500/10 text-sm text-cyan-300 
                               hover:text-cyan-400 font-mono font-medium transition-colors truncate max-w-[150px]"
                    title={part}
                  >
                    {part}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-52 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
             className="w-full bg-[#050810] border border-cyan-900/40 rounded-lg pl-9 pr-3 py-1.5 text-sm 
                        text-cyan-300 placeholder-cyan-800/40 outline-none focus:border-cyan-500/40 transition-colors font-mono"
            placeholder="Ara..."
            onClick={e => e.stopPropagation()}
          />
        </div>

        {/* View Mode */}
         <div className="flex items-center gap-0 border border-cyan-900/40 rounded-lg overflow-hidden flex-shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-cyan-500/15 text-cyan-400' : 'text-cyan-700 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
            title="Izgara görünümü"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-cyan-500/15 text-cyan-400' : 'text-cyan-700 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
            title="Liste görünümü"
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══ CONTENT AREA ═══ */}
       <div className="flex-1 bg-[#050810] border border-cyan-900/30 rounded-xl overflow-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500/40" />
              <p className="text-slate-600 text-sm">Yükleniyor...</p>
            </div>
          </div>
        ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-3 opacity-30">📂</div>
              <p className="text-slate-600 text-sm">
                {search ? 'Eşleşen öğe bulunamadı' : currentDir ? 'Bu klasör boş' : 'Henüz dosya yedeklenmemiş'}
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* ─── GRID VIEW ─── */
          <div className="p-4 grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-1">
            {/* Folders */}
            {filteredFolders.map(folder => (
              <div
                key={'folder-' + folder}
                 className={`group flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer transition-all
                            select-none hover:bg-cyan-500/5
                            ${selected === 'folder-' + folder ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSelected('folder-' + folder) }}
                onDoubleClick={() => navigateTo(currentDir ? currentDir + '\\' + folder : folder)}
                onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
              >
                <div className="relative">
                  <Folder className="w-12 h-12 text-amber-400/80 group-hover:text-amber-400 transition-colors fill-amber-400/20 group-hover:fill-amber-400/30" />
                </div>
                <span className="text-xs text-slate-400 group-hover:text-slate-200 text-center truncate w-full leading-tight transition-colors"
                      title={folder}>
                  {folder}
                </span>
              </div>
            ))}

            {/* Files */}
            {filteredFiles.map(f => (
              <div
                key={'file-' + f.path}
                 className={`group flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer transition-all
                            select-none hover:bg-cyan-500/5
                            ${selected === f.path ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30' : ''}
                           ${deleting === f.path ? 'opacity-40 pointer-events-none' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSelected(f.path) }}
                onContextMenu={(e) => handleContextMenu(e, f, 'file')}
                onDoubleClick={() => handleDownload(f)}
              >
                <div className={`relative ${getFileColor(f.name)} group-hover:brightness-125 transition-all`}>
                  {getFileIcon(f.name) ? (
                    <div className="w-12 h-12 flex items-center justify-center">
                      <div className="transform scale-[2]">{getFileIcon(f.name)}</div>
                    </div>
                  ) : (
                    <File className="w-12 h-12" />
                  )}
                </div>
                <span className="text-xs text-slate-400 group-hover:text-slate-200 text-center truncate w-full leading-tight transition-colors"
                      title={f.name}>
                  {f.name}
                </span>
                <span className="text-[10px] text-slate-600 font-mono">{f.size_human}</span>
              </div>
            ))}
          </div>
        ) : (
          /* ─── LIST VIEW ─── */
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
               <tr className="border-b border-cyan-900/30 bg-[#070b14]">
                {['Ad', 'Tür', 'Boyut', 'Makine', 'Tarih', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider first:pl-5 last:pr-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Folders */}
              {filteredFolders.map(folder => (
                <tr
                  key={'folder-' + folder}
                  className={`border-b border-[#162033]/30 cursor-pointer transition-colors group select-none
                             ${selected === 'folder-' + folder ? 'bg-blue-500/8' : 'hover:bg-white/[0.02]'}`}
                  onClick={(e) => { e.stopPropagation(); setSelected('folder-' + folder) }}
                  onDoubleClick={() => navigateTo(currentDir ? currentDir + '\\' + folder : folder)}
                  onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
                >
                  <td className="pl-5 pr-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-amber-400/80 fill-amber-400/20 flex-shrink-0" />
                      <span className="text-slate-200 font-medium truncate">{folder}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">Dosya Klasörü</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">—</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">—</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">—</td>
                  <td className="pr-5 py-2.5"></td>
                </tr>
              ))}

              {/* Files */}
              {filteredFiles.map(f => (
                <tr
                  key={'file-' + f.path}
                  className={`border-b border-[#162033]/30 cursor-pointer transition-colors group select-none
                             ${selected === f.path ? 'bg-blue-500/8' : 'hover:bg-white/[0.02]'}
                             ${deleting === f.path ? 'opacity-40 pointer-events-none' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSelected(f.path) }}
                  onContextMenu={(e) => handleContextMenu(e, f, 'file')}
                  onDoubleClick={() => handleDownload(f)}
                >
                  <td className="pl-5 pr-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className={`flex-shrink-0 ${getFileColor(f.name)}`}>{getFileIcon(f.name)}</span>
                      <span className="text-slate-200 truncate max-w-[260px]" title={f.name}>{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs font-mono uppercase">
                    {f.name.includes('.') ? f.name.split('.').pop() : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs font-mono whitespace-nowrap">{f.size_human}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] text-blue-400/70 bg-blue-500/5 border border-blue-500/10 px-1.5 py-0.5 rounded font-mono">
                      {f.machine}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">{timeAgo(f.backup_time || f.updated)}</td>
                  <td className="pr-5 py-2.5">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(f) }}
                        disabled={downloading === f.path}
                        className="p-1.5 rounded-lg text-blue-400/70 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        title="İndir"
                      >
                        <Download className={`w-3.5 h-3.5 ${downloading === f.path ? 'animate-bounce' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(f) }}
                        disabled={deleting === f.path}
                        className="p-1.5 rounded-lg text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div className="flex items-center justify-between mt-2 px-2">
        <div className="flex items-center gap-4 text-[11px] text-slate-600">
          <span>
            <span className="text-slate-400 font-medium">{filteredFolders.length + filteredFiles.length}</span> öğe
          </span>
          {selected && (
            <span className="text-blue-400/60">1 öğe seçili</span>
          )}
        </div>
        <div className="text-[11px] text-slate-600">
          Toplam: <span className="text-slate-400 font-medium">{stats.total_size_human || '0 B'}</span>
        </div>
      </div>

      {/* ═══ CONTEXT MENU ═══ */}
      {contextMenu && (
        <div
           className="fixed z-50 bg-[#0b1221] border border-cyan-900/30 rounded-xl shadow-2xl shadow-black/50 
                      py-1.5 min-w-[180px] animate-fade-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.type === 'folder' ? (
            <>
              <button
                onClick={() => {
                  navigateTo(currentDir ? currentDir + '\\' + contextMenu.item : contextMenu.item)
                  setContextMenu(null)
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Folder className="w-4 h-4 text-amber-400/80" />
                Aç
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleDownload(contextMenu.item)}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4 text-blue-400" />
                İndir
              </button>
              <div className="border-t border-[#1e2d44] my-1" />
              <button
                onClick={() => handleDelete(contextMenu.item)}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Sil
              </button>
            </>
          )}
        </div>
      )}

      {/* ═══ TOAST ═══ */}
      {toast && (
         <div className="fixed bottom-6 right-6 bg-[#0b1221] border border-cyan-500/20 rounded-xl px-5 py-3.5 text-sm 
                         shadow-2xl shadow-cyan-500/5 z-50 text-cyan-200 backdrop-blur-lg font-mono animate-slide-up">
          {toast}
        </div>
      )}
    </div>
  )
}
