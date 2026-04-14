import { useEffect, useState } from 'react'
import { api } from '../api'
import { Save, Plus, X, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'

function Section({ title, children }) {
  return (
    <div className="card p-6 mb-5">
      <h2 className="text-sm font-bold text-slate-200 mb-5 pb-3 border-b border-[#162033]">{title}</h2>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium text-slate-300">{label}</div>
        {desc && <div className="text-xs text-slate-600 mt-0.5">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full border transition-all duration-200 flex-shrink-0 ${
          checked ? 'bg-blue-600 border-blue-500' : 'bg-bg border-[#162033]'
        }`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function TagList({ tags, onRemove, placeholder, onAdd, addValue, setAddValue }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
        {tags.map((t, i) => (
          <span key={t} className="inline-flex items-center gap-1 badge bg-blue-500/8 text-blue-400 border border-blue-500/15 py-1 px-2.5">
            <span className="font-mono text-[11px]">{t}</span>
            <button onClick={() => onRemove(i)} className="text-slate-600 hover:text-red-400 transition-colors ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-slate-700 italic self-center">{placeholder}</span>}
      </div>
      <div className="flex gap-2">
        <input
          className="inp font-mono max-w-[140px]"
          value={addValue}
          onChange={e => setAddValue(e.target.value)}
          placeholder=".pdf"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
        />
        <button className="btn-ghost flex items-center gap-1.5" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" /> Ekle
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const [cfg, setCfg]           = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [showKey, setShowKey]   = useState(false)
  const [newAllow, setNewAllow] = useState('')
  const [newBlock, setNewBlock] = useState('')
  const [newPath, setNewPath]   = useState('')

  useEffect(() => { api.getConfig().then(d => setCfg(d)).catch(() => {}) }, [])

  function set(path, val) {
    setCfg(prev => {
      const next = { ...prev }
      const keys = path.split('.')
      let cur = next
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] }
        cur = cur[keys[i]]
      }
      cur[keys[keys.length - 1]] = val
      return next
    })
  }

  function addExt(type) {
    const key = type === 'allow' ? 'allowed_extensions' : 'blocked_extensions'
    const val = type === 'allow' ? newAllow : newBlock
    let ext = val.trim().toLowerCase()
    if (!ext) return
    if (!ext.startsWith('.')) ext = '.' + ext
    if (!cfg[key].includes(ext)) set(key, [...cfg[key], ext])
    type === 'allow' ? setNewAllow('') : setNewBlock('')
  }

  function removeExt(type, i) {
    const key = type === 'allow' ? 'allowed_extensions' : 'blocked_extensions'
    set(key, cfg[key].filter((_, idx) => idx !== i))
  }

  function addPath() {
    if (!newPath.trim()) return
    set('watch_paths', [...(cfg.watch_paths || []), newPath.trim()])
    setNewPath('')
  }

  async function save() {
    setSaving(true)
    try {
      await api.saveConfig(cfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    setSaving(false)
  }

  if (!cfg) return (
    <div className="p-8 flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
    </div>
  )

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Ayarlar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Yedekleme konfigürasyonu</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
        </button>
      </div>

      {saved && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Ayarlar kaydedildi. Agent 30 saniye içinde güncellenecek.
        </div>
      )}

      {/* AI Filter */}
      <Section title="🤖 AI Filtre — Groq Llama 70B">
        <Toggle
          checked={cfg.ai_filter_enabled !== false}
          onChange={v => set('ai_filter_enabled', v)}
          label="AI Filtreyi Aktif Et"
          desc="Yedeklenmesi gereken dosyaları Llama 70B seçer"
        />
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Groq API Key</label>
          <div className="relative">
            <input
              className="inp font-mono pr-10"
              type={showKey ? 'text' : 'password'}
              value={cfg.groq_api_key || ''}
              onChange={e => set('groq_api_key', e.target.value)}
              placeholder="gsk_..."
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-[11px] text-blue-500 hover:text-blue-400 mt-1 inline-block">
            console.groq.com'dan ücretsiz alabilirsiniz →
          </a>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Model</label>
          <select className="inp" value={cfg.ai_model || 'llama-3.3-70b-versatile'} onChange={e => set('ai_model', e.target.value)}>
            <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Önerilen)</option>
            <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Hızlı)</option>
            <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
          </select>
        </div>
      </Section>

      {/* Watch paths */}
      <Section title="📁 İzlenen Klasörler">
        <div className="space-y-2 mb-3">
          {(cfg.watch_paths || []).map((p, i) => (
            <div key={i} className="flex gap-2">
              <input className="inp font-mono" value={p} onChange={e => { const a = [...cfg.watch_paths]; a[i] = e.target.value; set('watch_paths', a) }} />
              <button className="btn-danger p-2.5 flex-shrink-0" onClick={() => set('watch_paths', cfg.watch_paths.filter((_, j) => j !== i))}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="inp font-mono" value={newPath} onChange={e => setNewPath(e.target.value)} placeholder="C:\Users\...\Documents" onKeyDown={e => e.key==='Enter' && addPath()} />
          <button className="btn-ghost flex-shrink-0 flex items-center gap-1.5" onClick={addPath}><Plus className="w-3.5 h-3.5" />Ekle</button>
        </div>
      </Section>

      {/* Extensions */}
      <Section title="🔍 Dosya Uzantıları">
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
            İzin Verilenler <span className="text-slate-700 font-normal normal-case">(boş = hepsi)</span>
          </label>
          <TagList
            tags={cfg.allowed_extensions || []}
            onRemove={i => removeExt('allow', i)}
            placeholder="Tüm uzantılara izin veriliyor"
            onAdd={() => addExt('allow')}
            addValue={newAllow}
            setAddValue={setNewAllow}
          />
        </div>
        <div className="border-t border-[#162033] pt-5">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Engellenenler</label>
          <TagList
            tags={cfg.blocked_extensions || []}
            onRemove={i => removeExt('block', i)}
            placeholder="Engellenen uzantı yok"
            onAdd={() => addExt('block')}
            addValue={newBlock}
            setAddValue={setNewBlock}
          />
        </div>
      </Section>

      {/* General */}
      <Section title="⚙️ Genel">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Maks. Dosya Boyutu (MB)</label>
            <input className="inp" type="number" min={1} value={cfg.max_file_size_mb || 50} onChange={e => set('max_file_size_mb', +e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Debounce (sn)</label>
            <input className="inp" type="number" min={0.5} step={0.5} value={cfg.debounce_seconds || 2} onChange={e => set('debounce_seconds', +e.target.value)} />
          </div>
        </div>
        <div className="space-y-1 border-t border-[#162033] pt-4">
          <Toggle checked={!!cfg.sync_on_start} onChange={v => set('sync_on_start', v)} label="Başlangıçta Senkronize Et" desc="Agent açılınca mevcut dosyaları yükle" />
          <Toggle checked={!!cfg.delete_on_remove} onChange={v => set('delete_on_remove', v)} label="PC'den Silinince Firebase'den de Sil" desc="Dikkatli kullan!" />
        </div>
      </Section>

      {/* Flash Drive */}
      <Section title="💾 Flash Sürücü Yedekleme">
        <Toggle
          checked={cfg.flash_enabled !== false}
          onChange={v => set('flash_enabled', v)}
          label="Flash Sürücü Yedeklemeyi Aktif Et"
          desc="USB / flash takılınca dosyaları otomatik yedekle"
        />
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Maksimum Dosya Boyutu (MB)
          </label>
          <input
            className="inp w-40"
            type="number"
            min={1}
            max={100}
            value={cfg.flash_max_mb ?? 10}
            onChange={e => set('flash_max_mb', +e.target.value)}
          />
          <p className="text-xs text-slate-600 mt-2">
            Bu boyutun üzerindeki flash dosyaları atlanır. Önerilen: 10 MB.
          </p>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs text-slate-500">
          <strong className="text-blue-400">Nasıl çalışır?</strong>
          <br />
          Flash takılınca dosyalar önce PC'deki stage klasörüne kopyalanır,
          sonra oradan yedeklenir. Flash çekilse bile yedekleme yarıda kalmaz.
        </div>
      </Section>

      {/* Firebase */}
      <Section title="🔥 Firebase">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Storage Bucket</label>
            <input className="inp font-mono" value={cfg.firebase?.storage_bucket || ''} onChange={e => set('firebase.storage_bucket', e.target.value)} placeholder="proje.appspot.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Credentials JSON Yolu</label>
            <input className="inp font-mono" value={cfg.firebase?.credentials_path || ''} onChange={e => set('firebase.credentials_path', e.target.value)} placeholder="firebase-credentials.json" />
          </div>
        </div>
      </Section>
    </div>
  )
}
