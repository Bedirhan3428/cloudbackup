import { useEffect, useState, useMemo, useCallback, useDeferredValue } from 'react'
import { api } from '../api'
import {
  Search, RefreshCw, Download, FileText, Image, Music, Video, Archive, Code, File,
  HardDrive, Layers, Clock, CheckCircle2, PackageOpen, HelpCircle, GraduationCap,
  ClipboardList, Filter, X
} from 'lucide-react'
import JSZip from 'jszip'

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

  if (imgExts.includes(ext)) return <Image className="w-4 h-4" />
  if (vidExts.includes(ext)) return <Video className="w-4 h-4" />
  if (audExts.includes(ext)) return <Music className="w-4 h-4" />
  if (arcExts.includes(ext)) return <Archive className="w-4 h-4" />
  if (codeExts.includes(ext)) return <Code className="w-4 h-4" />
  if (docExts.includes(ext)) return <FileText className="w-4 h-4" />
  return <File className="w-4 h-4" />
}

function getFileColor(name) {
  const ext = name?.split('.').pop()?.toLowerCase() || ''
  const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico']
  const vidExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv']
  const audExts = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'wma']
  const arcExts = ['zip', 'rar', '7z', 'tar', 'gz']
  const codeExts = ['py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'sql', 'sh', 'bat']
  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv']

  if (imgExts.includes(ext)) return 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
  if (vidExts.includes(ext)) return 'text-purple-400 bg-purple-500/5 border-purple-500/10'
  if (audExts.includes(ext)) return 'text-pink-400 bg-pink-500/5 border-pink-500/10'
  if (arcExts.includes(ext)) return 'text-orange-400 bg-orange-500/5 border-orange-500/10'
  if (codeExts.includes(ext)) return 'text-cyan-400 bg-cyan-500/5 border-cyan-500/10'
  if (docExts.includes(ext)) return 'text-blue-400 bg-blue-500/5 border-blue-500/10'
  return 'text-slate-400 bg-slate-500/5 border-slate-500/10'
}

const GRADE_FILTERS = ['9', '10', '11', '12']
const TERM_FILTERS = ['1', '2']
const WRITTEN_FILTERS = ['1', '2', '3', '4']

const EXAM_QUICK_SEARCHES = [
  '2. dönem 2. yazılı',
  '1. dönem 1. yazılı',
  '10. sınıf',
  '11. sınıf',
  'matematik yazılı',
  'ortak sınav',
]

const EXAM_WORDS = [
  'yazili',
  'sinav',
  'sinavi',
  'ortak',
  'quiz',
  'exam',
  'test',
  'deneme',
  'degerlendirme',
  'mazeret',
]

function normalizeSearchText(value = '') {
  return String(value)
    .toLocaleLowerCase('tr-TR')
    .replace(/[ç]/g, 'c')
    .replace(/[ğ]/g, 'g')
    .replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ş]/g, 's')
    .replace(/[ü]/g, 'u')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSearchTokens(value) {
  return normalizeSearchText(value).split(' ').filter(Boolean)
}

function detectGrade(text) {
  const match = text.match(/\b(9|10|11|12)\s*(?:sinif|snf)\b/) || text.match(/\b(?:sinif|snf)\s*(9|10|11|12)\b/)
  return match?.[1] || ''
}

function detectTerm(text) {
  const match = text.match(/\b([12])\s*(?:donem|donemi)\b/) || text.match(/\b(?:donem|donemi)\s*([12])\b/)
  return match?.[1] || ''
}

function detectWritten(text) {
  const match = text.match(/\b([1-4])\s*(?:yazili|sinav|sinavi)\b/) || text.match(/\b(?:yazili|sinav|sinavi)\s*([1-4])\b/)
  return match?.[1] || ''
}

function buildExamIndex(parts) {
  const searchText = normalizeSearchText(parts.filter(Boolean).join(' '))
  const matchedExamWords = EXAM_WORDS.filter(word => searchText.includes(word))

  return {
    searchText,
    grade: detectGrade(searchText),
    term: detectTerm(searchText),
    written: detectWritten(searchText),
    isExam: matchedExamWords.length > 0,
    matchedExamWords,
  }
}

export default function IncomingFiles() {
  const [zips, setZips] = useState([])
  const [loading, setLoading] = useState(true)
  const [decryptingZipId, setDecryptingZipId] = useState(null)
  const [downloadingFileId, setDownloadingFileId] = useState(null)
  const [toast, setToast] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedNode, setSelectedNode] = useState('all')
  const [selectedZip, setSelectedZip] = useState('all')
  const [selectedExt, setSelectedExt] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [selectedTerm, setSelectedTerm] = useState('all')
  const [selectedWritten, setSelectedWritten] = useState('all')
  const [examOnly, setExamOnly] = useState(false)
  const deferredSearch = useDeferredValue(search)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getFiles({ per_page: 500 })
      setZips(res.files || [])
    } catch (e) {
      showToast('❌ Veriler yüklenirken hata oluştu: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Extract all individual files from zip archives
  const allExtractedFiles = useMemo(() => {
    const files = []
    zips.forEach(z => {
      if (z.original_files && Array.isArray(z.original_files) && z.original_files.length > 0) {
        z.original_files.forEach(f => {
          if (!f) return
          const filePath = f.path || f.name || ''
          if (!filePath) return
          const name = filePath.split(/[\\/]/).pop() || 'isimsiz'
          const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : 'yok'
          files.push({
            id: `${z.id}::${filePath}`,
            name,
            original_path: filePath,
            size: f.size || 0,
            size_human: f.size ? humanSize(f.size) : '0 B',
            machine: z.machine || '—',
            backup_time: z.backup_time || z.updated || '',
            zip_name: z.name || '—',
            zip_id: z.id,
            zip_obj: z,
            ext,
            ...buildExamIndex([name, filePath, z.name, z.machine, ext]),
          })
        })
      } else {
        // Fallback for older archives that don't have original_files in Firestore
        const filePath = z.original_path || z.name || ''
        if (filePath) {
          const name = filePath.split(/[\\/]/).pop() || 'isimsiz'
          const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : 'yok'
          files.push({
            id: `${z.id}::fallback`,
            name: name.endsWith('.zip') || name.endsWith('.enc') ? z.name : name,
            original_path: filePath,
            size: z.size || 0,
            size_human: z.size_human || (z.size ? humanSize(z.size) : '0 B'),
            machine: z.machine || '—',
            backup_time: z.backup_time || z.updated || '',
            zip_name: z.name || '—',
            zip_id: z.id,
            zip_obj: z,
            ext,
            ...buildExamIndex([name, filePath, z.name, z.machine, ext]),
          })
        }
      }
    })
    return files
  }, [zips])

  // Legacy/Unindexed zips
  const unindexedZips = useMemo(() => {
    return zips.filter(z => !z.original_files || !Array.isArray(z.original_files))
  }, [zips])

  // Get nodes for node filter
  const uniqueNodes = useMemo(() => {
    const nodes = new Set()
    zips.forEach(z => { if (z.machine) nodes.add(z.machine) })
    return Array.from(nodes)
  }, [zips])

  // Get zips for zip container filter
  const uniqueZips = useMemo(() => {
    const names = new Set()
    zips.forEach(z => { if (z.name) names.add(z.name) })
    return Array.from(names)
  }, [zips])

  // Get extensions for ext filter
  const uniqueExtensions = useMemo(() => {
    const exts = new Set()
    allExtractedFiles.forEach(f => { if (f.ext) exts.add(f.ext) })
    return Array.from(exts)
  }, [allExtractedFiles])

  const examCandidateCount = useMemo(() => {
    return allExtractedFiles.reduce((count, f) => count + (f.isExam ? 1 : 0), 0)
  }, [allExtractedFiles])

  // Decrypt and index legacy zip archives on-the-fly
  const handleIndexZip = async (z) => {
    if (decryptingZipId) return
    setDecryptingZipId(z.id)
    showToast(`🔑 "${z.name}" indiriliyor, şifresi çözülüyor ve dosyalar çıkartılıyor...`)
    
    try {
      // 1. Download and decrypt zip
      const result = await api.downloadAndDecryptFile(z)
      const blobUrl = typeof result === 'object' ? result.url : result
      
      const response = await fetch(blobUrl)
      const arrayBuffer = await response.arrayBuffer()

      // 2. Read Zip content
      const zipObj = new JSZip()
      await zipObj.loadAsync(arrayBuffer)

      // 3. Map files
      const fileList = []
      const fileNames = Object.keys(zipObj.files).filter(name => !zipObj.files[name].dir)
      
      for (const name of fileNames) {
        const zipFile = zipObj.file(name)
        let uncompressedSize = 0
        if (zipFile) {
          uncompressedSize = zipFile._data?.uncompressedSize || 0
        }
        fileList.push({
          path: name,
          size: uncompressedSize,
          hash: ''
        })
      }

      if (fileList.length === 0) {
        throw new Error('Arşiv içeriği boş.')
      }

      // 4. Save metadata back to Firestore
      await api.saveOriginalFiles(z.id, fileList)
      showToast(`✅ "${z.name}" başarıyla indekslendi ve veri tabanına işlendi! (${fileList.length} dosya)`)
      
      // Cleanup Object URL
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
      }

      // 5. Reload
      await loadData()
    } catch (e) {
      showToast(`❌ İndeksleme hatası: ${e.message}`)
    } finally {
      setDecryptingZipId(null)
    }
  }

  // Decrypt and download single file from zip
  const handleDownloadSingle = async (fileItem) => {
    const fileId = fileItem.id
    if (downloadingFileId) return
    setDownloadingFileId(fileId)
    showToast(`📥 "${fileItem.name}" şifresi çözülüp indiriliyor...`)
    
    try {
      const result = await api.downloadAndDecryptSingleFile(fileItem.zip_obj, fileItem.original_path)
      
      const link = document.createElement('a')
      link.href = result.url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => URL.revokeObjectURL(result.url), 10000)
      showToast(`✅ İndirme tamamlandı: ${fileItem.name}`)
    } catch (e) {
      showToast(`❌ İndirme hatası: ${e.message}`)
    } finally {
      setDownloadingFileId(null)
    }
  }

  const searchTokens = useMemo(() => getSearchTokens(deferredSearch), [deferredSearch])

  const hasActiveFilters = Boolean(
    search.trim() ||
    selectedNode !== 'all' ||
    selectedZip !== 'all' ||
    selectedExt !== 'all' ||
    selectedGrade !== 'all' ||
    selectedTerm !== 'all' ||
    selectedWritten !== 'all' ||
    examOnly
  )

  function resetFilters() {
    setSearch('')
    setSelectedNode('all')
    setSelectedZip('all')
    setSelectedExt('all')
    setSelectedGrade('all')
    setSelectedTerm('all')
    setSelectedWritten('all')
    setExamOnly(false)
  }

  // Filtered files list
  const filteredFiles = useMemo(() => {
    let result = allExtractedFiles

    // Search query filter
    if (searchTokens.length) {
      result = result.filter(f => searchTokens.every(token => f.searchText.includes(token)))
    }

    // Exam paper filters
    if (examOnly) {
      result = result.filter(f => f.isExam)
    }
    if (selectedGrade !== 'all') {
      result = result.filter(f => f.grade === selectedGrade)
    }
    if (selectedTerm !== 'all') {
      result = result.filter(f => f.term === selectedTerm)
    }
    if (selectedWritten !== 'all') {
      result = result.filter(f => f.written === selectedWritten)
    }

    // Node filter
    if (selectedNode !== 'all') {
      result = result.filter(f => f.machine === selectedNode)
    }

    // Zip filter
    if (selectedZip !== 'all') {
      result = result.filter(f => f.zip_name === selectedZip)
    }

    // Extension filter
    if (selectedExt !== 'all') {
      result = result.filter(f => f.ext === selectedExt)
    }

    return result
  }, [
    allExtractedFiles,
    searchTokens,
    examOnly,
    selectedGrade,
    selectedTerm,
    selectedWritten,
    selectedNode,
    selectedZip,
    selectedExt,
  ])

  // Total size calculated from extracted files
  const totalExtractedSizeHuman = useMemo(() => {
    const total = filteredFiles.reduce((acc, f) => acc + f.size, 0)
    return humanSize(total)
  }, [filteredFiles])

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)] flex flex-col relative z-10" id="incoming_files_view">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 tracking-widest flex items-center gap-3 drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <Layers className="w-6 h-6 text-cyan-400" />
            GELEN DOSYALAR
          </h1>
          <p className="text-[10px] font-mono text-cyan-600 uppercase tracking-[0.2em] mt-1">
            Yedeklenen Arşivlerin İçindeki Ayıklanmış Dosya Listesi
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="btn-ghost flex items-center gap-2 self-end sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          YENİLE
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
        
        {/* Stat card 1 */}
        <div className="card p-4 flex items-center justify-between border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300">
          <div>
            <p className="text-[9px] font-mono font-bold text-cyan-600 uppercase tracking-widest">TOPLAM DOSYA</p>
            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300 tabular-nums">
              {allExtractedFiles.length.toLocaleString()}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
            <File className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

        {/* Stat card 2 */}
        <div className="card p-4 flex items-center justify-between border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300">
          <div>
            <p className="text-[9px] font-mono font-bold text-cyan-600 uppercase tracking-widest">SINAV ADAYI</p>
            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300 tabular-nums">
              {examCandidateCount.toLocaleString()}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

        {/* Stat card 3 */}
        <div className="card p-4 flex items-center justify-between border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300">
          <div>
            <p className="text-[9px] font-mono font-bold text-cyan-600 uppercase tracking-widest">İNDEKS DURUMU</p>
            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300 tabular-nums">
              {zips.length - unindexedZips.length} / {zips.length}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Stat card 4 */}
        <div className="card p-4 flex items-center justify-between border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300">
          <div>
            <p className="text-[9px] font-mono font-bold text-cyan-600 uppercase tracking-widest">FİLTRELİ BOYUT</p>
            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300 tabular-nums">
              {totalExtractedSizeHuman}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

      </div>

      {/* Grid Layout: Main List & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start flex-1 min-h-0">
        
        {/* Main List Column (Left) */}
        <div className="lg:col-span-3 flex flex-col h-full space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          
          {/* Filtering Tools Card */}
          <div className="card p-4 border-cyan-500/10 bg-[#0b1221]/70 backdrop-blur-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
              
              {/* Search Bar */}
              <div className="relative sm:col-span-2 xl:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-800/60" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="2. dönem 2. yazılı, 10. sınıf..."
                  className="w-full bg-[#050810] border border-cyan-900/40 focus:border-cyan-500/40 rounded-lg pl-9 pr-3 py-2 text-xs text-cyan-100 placeholder-cyan-800/40 outline-none transition-all font-mono"
                />
              </div>

              {/* Grade Filter */}
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                className="bg-[#050810] border border-cyan-900/40 focus:border-cyan-500/40 rounded-lg px-3 py-2 text-xs text-cyan-200 outline-none transition-all font-mono cursor-pointer"
              >
                <option value="all">TÜM SINIFLAR</option>
                {GRADE_FILTERS.map(grade => (
                  <option key={grade} value={grade}>{grade}. SINIF</option>
                ))}
              </select>

              {/* Term Filter */}
              <select
                value={selectedTerm}
                onChange={e => setSelectedTerm(e.target.value)}
                className="bg-[#050810] border border-cyan-900/40 focus:border-cyan-500/40 rounded-lg px-3 py-2 text-xs text-cyan-200 outline-none transition-all font-mono cursor-pointer"
              >
                <option value="all">TÜM DÖNEMLER</option>
                {TERM_FILTERS.map(term => (
                  <option key={term} value={term}>{term}. DÖNEM</option>
                ))}
              </select>

              {/* Written Exam Filter */}
              <select
                value={selectedWritten}
                onChange={e => setSelectedWritten(e.target.value)}
                className="bg-[#050810] border border-cyan-900/40 focus:border-cyan-500/40 rounded-lg px-3 py-2 text-xs text-cyan-200 outline-none transition-all font-mono cursor-pointer"
              >
                <option value="all">TÜM YAZILILAR</option>
                {WRITTEN_FILTERS.map(written => (
                  <option key={written} value={written}>{written}. YAZILI</option>
                ))}
              </select>

              {/* Extension Filter */}
              <select
                value={selectedExt}
                onChange={e => setSelectedExt(e.target.value)}
                className="bg-[#050810] border border-cyan-900/40 focus:border-cyan-500/40 rounded-lg px-3 py-2 text-xs text-cyan-200 outline-none transition-all font-mono cursor-pointer"
              >
                <option value="all">TÜM UZANTILAR ({uniqueExtensions.length})</option>
                {uniqueExtensions.map(ext => (
                  <option key={ext} value={ext}>.{ext.toUpperCase()}</option>
                ))}
              </select>

              {/* Node (Machine) Filter */}
              <select
                value={selectedNode}
                onChange={e => setSelectedNode(e.target.value)}
                className="bg-[#050810] border border-cyan-900/40 focus:border-cyan-500/40 rounded-lg px-3 py-2 text-xs text-cyan-200 outline-none transition-all font-mono cursor-pointer"
              >
                <option value="all">TÜM DÜĞÜMLER ({uniqueNodes.length})</option>
                {uniqueNodes.map(node => (
                  <option key={node} value={node}>{node.toUpperCase()}</option>
                ))}
              </select>

              {/* Zip Container Filter */}
              <select
                value={selectedZip}
                onChange={e => setSelectedZip(e.target.value)}
                className="bg-[#050810] border border-cyan-900/40 focus:border-cyan-500/40 rounded-lg px-3 py-2 text-xs text-cyan-200 outline-none transition-all font-mono cursor-pointer sm:col-span-2 xl:col-span-2"
              >
                <option value="all">TÜM ARŞİVLER ({uniqueZips.length})</option>
                {uniqueZips.map(zName => (
                  <option key={zName} value={zName}>{zName}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setExamOnly(v => !v)}
                className={`rounded-lg border px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2 ${
                  examOnly
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                    : 'bg-[#050810] border-cyan-900/40 text-cyan-500/70 hover:border-cyan-500/40 hover:text-cyan-300'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                SINAV
              </button>

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="rounded-lg border border-cyan-900/40 bg-[#050810] px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-500/70 transition-all inline-flex items-center justify-center gap-2 hover:border-cyan-500/40 hover:text-cyan-300 disabled:opacity-35 disabled:hover:border-cyan-900/40 disabled:hover:text-cyan-500/70"
              >
                <X className="w-3.5 h-3.5" />
                SIFIRLA
              </button>

            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {EXAM_QUICK_SEARCHES.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSearch(item)}
                  className={`px-2.5 py-1 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wide transition-all ${
                    normalizeSearchText(search) === normalizeSearchText(item)
                      ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300'
                      : 'bg-[#050810] border-cyan-900/35 text-cyan-600 hover:text-cyan-300 hover:border-cyan-500/35'
                  }`}
                >
                  {item}
                </button>
              ))}
              <div className="ml-auto inline-flex items-center gap-2 rounded-md border border-cyan-900/30 bg-[#050810]/80 px-2.5 py-1 text-[10px] font-mono text-cyan-600">
                <GraduationCap className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-cyan-300 font-bold">{filteredFiles.length.toLocaleString()}</span>
                <span>SONUÇ</span>
              </div>
            </div>
          </div>

          {/* Table Container Card */}
          <div className="card border-cyan-500/10 bg-[#050810] flex-1 overflow-auto rounded-xl shadow-2xl relative min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-cyan-600/50">
                <RefreshCw className="w-8 h-8 animate-spin mb-3 text-cyan-500" />
                <span className="text-xs font-mono tracking-widest uppercase">Dosya verileri yükleniyor...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-cyan-700/50">
                <PackageOpen className="w-16 h-16 mb-4 text-cyan-900/55" />
                <h3 className="font-mono tracking-wider uppercase mb-1 text-cyan-500 text-sm font-bold">Veri Bulunamadı</h3>
                <p className="text-[10px] max-w-md text-center text-cyan-700/80 px-4">
                  {search || selectedNode !== 'all' || selectedZip !== 'all' || selectedExt !== 'all'
                    ? 'Seçilen filtrelere uyan hiçbir ayıklanmış dosya bulunamadı. Filtreleri sıfırlamayı deneyin.'
                    : 'Henüz hiçbir arşiv çözümlenip sisteme işlenmemiş veya gelen zip dosyası yok. Yan panelden eski zipleri çözebilirsin.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-cyan-900/40 bg-[#070b14]/70 sticky top-0 z-10 backdrop-blur-md">
                    <th className="px-4 py-3 font-mono font-bold text-cyan-600 uppercase tracking-widest text-[9px]">Dosya Adı</th>
                    <th className="px-4 py-3 font-mono font-bold text-cyan-600 uppercase tracking-widest text-[9px] hidden md:table-cell">Orijinal Yol</th>
                    <th className="px-4 py-3 font-mono font-bold text-cyan-600 uppercase tracking-widest text-[9px] hidden lg:table-cell">Ait Olduğu Zip</th>
                    <th className="px-4 py-3 font-mono font-bold text-cyan-600 uppercase tracking-widest text-[9px]">Boyut</th>
                    <th className="px-4 py-3 font-mono font-bold text-cyan-600 uppercase tracking-widest text-[9px] hidden sm:table-cell">Cihaz</th>
                    <th className="px-4 py-3 font-mono font-bold text-cyan-600 uppercase tracking-widest text-[9px] hidden lg:table-cell">Tarih</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-950/20">
                  {filteredFiles.map(f => {
                    const isDownloading = downloadingFileId === f.id
                    return (
                      <tr 
                        key={f.id} 
                        className="hover:bg-cyan-500/[0.02] transition-colors border-b border-cyan-950/10 group font-mono text-[11px]"
                      >
                        
                        {/* Name */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded border flex-shrink-0 ${getFileColor(f.name)}`}>
                              {getFileIcon(f.name)}
                            </div>
                            <span className="font-bold text-cyan-100 truncate max-w-[180px] sm:max-w-[240px]" title={f.name}>
                              {f.name}
                            </span>
                          </div>
                        </td>

                        {/* Original Path */}
                        <td className="px-4 py-2.5 text-cyan-600/80 max-w-[200px] truncate hidden md:table-cell" title={f.original_path}>
                          {f.original_path}
                        </td>

                        {/* Zip name */}
                        <td className="px-4 py-2.5 text-cyan-700 max-w-[150px] truncate hidden lg:table-cell" title={f.zip_name}>
                          <span className="inline-flex items-center gap-1">
                            <Archive className="w-3 h-3 text-amber-500/70" />
                            {f.zip_name}
                          </span>
                        </td>

                        {/* Size */}
                        <td className="px-4 py-2.5 text-cyan-400/90 whitespace-nowrap">{f.size_human}</td>

                        {/* Node */}
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <span className="badge bg-cyan-950 border border-cyan-500/20 text-cyan-400 text-[9px] uppercase">
                            {f.machine}
                          </span>
                        </td>

                        {/* Capture Time */}
                        <td className="px-4 py-2.5 text-slate-500 hidden lg:table-cell whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-600" />
                            {timeAgo(f.backup_time)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDownloadSingle(f)}
                            disabled={!!downloadingFileId}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all tracking-wider inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40 disabled:opacity-40 disabled:hover:bg-cyan-500/10`}
                            title="Sadece bu dosyayı çöz ve indir"
                          >
                            <Download className={`w-3 h-3 ${isDownloading ? 'animate-bounce' : ''}`} />
                            {isDownloading ? 'ÇÖZÜLÜYOR...' : 'DOSYAYI İNDİR'}
                          </button>
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Unindexed Zips Column (Right) */}
        <div className="lg:col-span-1 animate-slide-up flex flex-col h-full space-y-4" style={{ animationDelay: '150ms' }}>
          
          <div className="card p-4 border-cyan-500/10 bg-[#0b1221]/70 backdrop-blur-md flex flex-col">
            <h2 className="font-mono font-bold text-cyan-400 text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
              <PackageOpen className="w-4 h-4 text-cyan-400" />
              ÇÖZÜLMEMİŞ ARŞİVLER ({unindexedZips.length})
            </h2>
            <p className="text-[10px] text-cyan-700/80 mb-4 leading-relaxed font-mono">
              Eski yedeklerin içindeki dosyalar Firestore'a kaydedilmemiştir. Aşağıdaki listeden çözdürmek istediğin yedeği seçip indeksleyebilirsin.
            </p>

            {loading ? (
              <div className="py-6 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-500/50" />
              </div>
            ) : unindexedZips.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center flex flex-col items-center justify-center py-6">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1" />
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Tüm Arşivler Çözüldü</span>
                <span className="text-[9px] text-emerald-600 font-mono mt-1">Gelen tüm dosyalar listeleniyor.</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {unindexedZips.map(z => {
                  const isDecrypting = decryptingZipId === z.id
                  return (
                    <div 
                      key={z.id}
                      className="p-3 bg-[#050810] border border-cyan-900/35 hover:border-cyan-500/30 rounded-lg transition-colors flex flex-col space-y-2 font-mono text-[10px]"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <p className="font-bold text-cyan-200 truncate" title={z.name}>{z.name}</p>
                          <p className="text-cyan-700 text-[9px] mt-0.5 uppercase tracking-wide">Makine: {z.machine}</p>
                        </div>
                        <span className="text-[9px] text-cyan-600 whitespace-nowrap">{z.size_human}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-1 border-t border-cyan-900/20">
                        <span className="text-slate-600 text-[9px]">{timeAgo(z.backup_time)}</span>
                        <button
                          onClick={() => handleIndexZip(z)}
                          disabled={!!decryptingZipId}
                          className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                        >
                          {isDecrypting ? 'Çözülüyor...' : 'Çöz & İndeksle'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Quick Info card */}
          <div className="card p-4 border-cyan-500/10 bg-[#0b1221]/50 backdrop-blur-md flex flex-col font-mono text-[9px] text-cyan-700 space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-500 font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>SİSTEM BİLGİSİ</span>
            </div>
            <p className="leading-relaxed">
              * Ajan tarafından yüklenen yeni yedeklerin dosya listeleri sunucu seviyesinde otomatik olarak çözülüp Firestore veri tabanına işlenecektir.
            </p>
            <p className="leading-relaxed">
              * Tek bir dosya indirilirken, arşivin tamamı tarayıcında çözülüp sadece o dosya ayıklanır. İnternet kotanı korumak için tasarlanmıştır.
            </p>
          </div>

        </div>

      </div>

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#0b1221]/95 border border-cyan-500/30 rounded-xl px-5 py-3.5 text-xs 
                        shadow-2xl shadow-cyan-500/10 z-50 text-cyan-200 backdrop-blur-lg font-mono animate-slide-up flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          {toast}
        </div>
      )}

    </div>
  )
}
